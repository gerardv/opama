using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Opama.Configuration;
using Opama.EMailTemplates;
using Opama.Models;
using Opama.ViewModels;
using System;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Mail;

namespace Opama.Web.Controllers
{
    [RequireHttps]
    public class AppController : Controller
    {
        private ApplicationDbContext _db;
        private AppSettings _appSettings;

        public AppController( ApplicationDbContext db, IOptions<AppSettings> appSettings)
        {
            _db = db;
            _appSettings = appSettings.Value;
        }

        // Serve the app.
        [HttpGet]
        public ActionResult Index() => View( "App" );

        [HttpPost]
        public JsonResult Register(User newUser)
        {
            JsonResult result = new JsonResult(new { success = false });

            if ( ModelState.IsValid )
            {
                // Complete the user model
                newUser.Disabled = true;
                newUser.EmailConfirmationCode = Guid.NewGuid().ToString();
                newUser.RegisteredOn = new DateTime(System.DateTime.Now.Ticks);

               
                SmtpClient client = new SmtpClient(_appSettings.MailHost); // Note: configure your preferred e-mail server or (temporarily) install Papercut (https://github.com/ChangemakerStudios/Papercut/releases).
                string HTMLBody = HTMLEMailScaffold.HTMLBody;

                // There still seems to be some duplicate code below. ToDo: DRY this.
                if ( _db.Users.Any( u => u.Email == newUser.Email ) )
                {
                    // The e-mail address has already been registered.
                    try
                    {
                        // Setup the user's GUID for future account reset
                        User existingUser = _db.Users.FirstOrDefault( u => u.Email == newUser.Email );
                        existingUser.EmailConfirmationCode = newUser.EmailConfirmationCode;
                        _db.SaveChanges();

                        // Send a informational e-mail to the account's e-mail address.
                        string plainBody = DuplicateRegistrationEMail.TextBody;
                        HTMLBody = HTMLBody.Replace("<%BODY%>", DuplicateRegistrationEMail.HTMLBody);
                        HTMLBody = HTMLBody.Replace("<%NAME%>", newUser.FirstName);
                        plainBody = plainBody.Replace("<%NAME%>", newUser.FirstName);
                        HTMLBody = HTMLBody.Replace("<%EMAIL%>", newUser.Email);
                        plainBody = plainBody.Replace("<%EMAIL%>", newUser.Email);
                        HTMLBody = HTMLBody.Replace("<%GUID%>", newUser.EmailConfirmationCode);
                        plainBody = plainBody.Replace("<%GUID%>", newUser.EmailConfirmationCode);
                        HTMLBody = HTMLBody.Replace("<%HOST%>", Request.Host.ToString());
                        plainBody = plainBody.Replace("<%HOST%>", Request.Host.ToString());

                        MailMessage verificationEmail = new MailMessage
                        {
                            From = new MailAddress(_appSettings.SendFrom),
                            Subject = VerificationEmail.Subject.ToString(),
                        };
                        verificationEmail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(HTMLBody, null, "text/html"));
                        verificationEmail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainBody, null, "text/plain"));

                        verificationEmail.To.Add(new MailAddress(newUser.Email));

                        client.Send(verificationEmail);

                        result.Value = new { success = true }; // Act as if everything went fine.
                    }
                    catch (Exception e)
                    {
                        throw e;
                    }
                }
                else
                {
                    try
                    {
                        _db.Users.Add(newUser);
                        _db.SaveChanges();

                        string plainBody = VerificationEmail.TextBody;
                        HTMLBody = HTMLBody.Replace("<%BODY%>", VerificationEmail.HTMLBody);
                        HTMLBody = HTMLBody.Replace("<%NAME%>", newUser.FirstName);
                        plainBody = plainBody.Replace("<%NAME%>", newUser.FirstName);
                        HTMLBody = HTMLBody.Replace("<%GUID%>", newUser.EmailConfirmationCode);
                        plainBody = plainBody.Replace("<%GUID%>", newUser.EmailConfirmationCode);
                        HTMLBody = HTMLBody.Replace("<%HOST%>", Request.Host.ToString());
                        plainBody = plainBody.Replace("<%HOST%>", Request.Host.ToString());

                        MailMessage verificationEmail = new MailMessage
                        {
                            From = new MailAddress(_appSettings.SendFrom),
                            Subject = VerificationEmail.Subject.ToString()
                        };
                        verificationEmail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(HTMLBody, null, "text/html"));
                        verificationEmail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainBody, null, "text/plain"));

                        verificationEmail.To.Add(new MailAddress(newUser.Email));

                        client.Send(verificationEmail);

                        result.Value = new { success = true }; // Success!
                    }
                    catch (Exception e)
                    {
                        throw e;
                    }
                }
            }

            return result;
        }

        public ActionResult NoSignUp(string guid)
        {
            // The user clicked the "I didn't sign up" link in the verification email.

            // Retrieve user account by the verification code (guid) supplied.
            User user = _db.Users.FirstOrDefault(u => u.EmailConfirmationCode == guid);
            if (user != null)
            {
                _db.Users.Remove(user); // Delete the user.
                _db.SaveChanges();
            }

            // Confirm account signup cancellation.
            return View();
        }

        public ActionResult NoVerify(string guid)
        {
            // The user clicked the "No verify" link in the duplicate registration email.

            // Retrieve user account by the guid supplied
            User user = _db.Users.FirstOrDefault(u => u.EmailConfirmationCode == guid);
            if (user != null)
            {
                user.EmailConfirmationCode = null;
                _db.SaveChanges();
            }

            // Always confirm account signup cancellation.
            return View("App", new MessageVM() { MMessage = "Thanks for letting us now." } );
        }

        public ActionResult Verify(string guid)
        {
            // The user clicked the "verify" link in the verification email.

            User user = _db.Users.FirstOrDefault(u => u.EmailConfirmationCode == guid);
            if (user != null)
            {
                user.Disabled = false;
                user.EmailConfirmationCode = "";

                _db.SaveChanges();
            }

            // Success or fail, direct to SPA and display success either way. This is a security feature, actually!
            return View("App",
                new MessageVM() {
                    MType = "AccountVerificationSuccess",
                    MMessage = "Your account has been succesfully verified."
                });
        }

        [HttpPost]
        public JsonResult GetSalt(string Email)
        {
            JsonResult result = new JsonResult(new { success = false, message = "Something went wrong server-side." });

            try
            {
                User user = _db.Users.FirstOrDefault(u => u.Email == Email && u.Disabled == false);

                if (user == null)
                {
                    result.Value = new { success = false, message = "Failed to retrieve your account or your account is disabled." };
                }
                else
                {
                    // Encryption parameters are stored as a JSON object so we can easily pass them to the client.
                    result.Value = user.EncParams;
                }

            }
            catch ( SqlException e )
            {
                result.Value = new { success = false, message = e.Message };
            }

            return result;
        }

        [HttpPost]
        public JsonResult UpdatePassword(string Email, string oldPasswordHash, string newPasswordHash)
        {
            JsonResult result = new JsonResult( new {} );
            User user = _db.Users.FirstOrDefault(u => u.Email == Email && u.EncPassword == oldPasswordHash && !u.Disabled);

            if (user != null && (newPasswordHash != null || newPasswordHash == "") )
            {
                try
                {
                    user.EncPassword = newPasswordHash;
                    _db.SaveChanges();
                    result.Value = new { success = true };
                }
                catch (Exception e)
                {
                    result.Value = new { success = false, error = e };
                }
            }

            return result;
        }

        [HttpGet]
        public ActionResult Reset(string guid) => View(new ResetVM() { EMailConfirmationCode = guid });

        [HttpPost]
        public ActionResult Reset(string Email, string EmailConfirmationCode)
        {
            // The user filled out the reset form.

            MessageVM result = new MessageVM() { MMessage = "" };

            try
            {
                User user = _db.Users.FirstOrDefault(u => u.EmailConfirmationCode == EmailConfirmationCode && u.Email == Email);
                if (user != null)
                {
                    _db.Users.Remove(user);
                    _db.SaveChanges();
                }
                
                // Whether or not the user's account was found, the result is 'Success!' to mislead imposters.
                result.MMessage = "Your account has been succesfully deleted.";

            } catch (Exception e)
            {
                // Something went technically wrong. Inform the user.
                result.MMessage = "Due to technical problems your account has not been deleted. The server said: " + e.Message;
            }

            return View("App", result);
        }

        protected override void Dispose(bool disposing)
        {
            _db.Dispose();
            base.Dispose(disposing);
        }
    }
}
