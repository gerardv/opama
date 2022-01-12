using Microsoft.AspNetCore.Mvc;
using Opama.Models;
using System;
using System.Linq;

namespace OPSA.Web.Controllers
{
    public class secretsController : Controller
    {
        private ApplicationDbContext _db;

        public secretsController(ApplicationDbContext db) => _db = db;

        [HttpPost]
        public JsonResult Get(string email, string encPassword)
        {
            JsonResult result = new JsonResult( new {} );
            User user = _db.Users.FirstOrDefault(u => u.Email == email && u.EncPassword == encPassword && !u.Disabled);

            if (user == null)
            {
                result.Value = new { success = false, eMail = email };
            }
            else
            {
                IQueryable<Object> records = _db.Secrets.Where(i => i.UserId.CompareTo(user.Id) > 0).Select(j => new
                {
                    j.Id,
                    j.Value
                });

                result.Value = new { success = true, records = Json(records) };
            }

            return result;
        }

        [HttpPost]
        public JsonResult Create(string email, string encPassword, string value)
        {
            JsonResult result = new JsonResult( new{} );
            User user = _db.Users.FirstOrDefault(u => u.Email == email && u.EncPassword == encPassword);
            Secret secret = new Secret();

            if (user != null)
            {
                try
                {
                    secret.User = user;
                    secret.Value = value;
                    _db.Secrets.Add(secret);
                    _db.SaveChanges();
                    result.Value = new { success = true, id = secret.Id.ToString() };
                }
                catch (Exception e)
                {
                    result.Value = new { success = false, error = e.GetType().ToString() };
                }
            }

            return result;
        }

        [HttpPost]
        public JsonResult Update(string email, string encPassword, string id, string value)
        {
            JsonResult result = new JsonResult( new{} );
            User user = _db.Users.FirstOrDefault(u => u.Email == email && u.EncPassword == encPassword);

            try
            {
                Secret secretToBeEdited = _db.Secrets.FirstOrDefault(i => i.Id.ToString() == id && i.UserId == user.Id);

                if (user != null && secretToBeEdited != null)
                {
                    secretToBeEdited.Value = value;
                    _db.SaveChanges();
                    result.Value = new { success = true };
                }
            }
            catch (Exception e)
            {
                result.Value = new { success = false, error = e.GetType().ToString() };
            }

            return result;
        }

        [HttpPost]
        public JsonResult Delete(string email, string encPassword, Guid id)
        {
            JsonResult result = new JsonResult( new {} );
            User user = _db.Users.FirstOrDefault(u => u.Email == email && u.EncPassword == encPassword);

            if (user != null && ModelState.IsValid)
            {
                try
                {
                    Secret secret = _db.Secrets.Find(id);
                    if (secret.UserId.ToString() == user.Id.ToString() ) // User's trying to delete owned item.
                    {
                        _db.Secrets.Remove(secret);
                        _db.SaveChanges();
                        result.Value = new { success = true, message = "Successfully deleted the item." };
                    }
                    else
                    {
                        result.Value = new { success = false, message = "Not authorized!" };
                    }
                }
                catch (Exception e)
                {
                    result.Value = new { success = false, error = e.GetType().ToString() };
                }
            }

            return result;
        }

        protected override void Dispose(bool disposing)
        {
            _db.Dispose();
            base.Dispose(disposing);
        }
    }
}
