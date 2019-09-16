var Opama = (function (Opama) {
    var email, password, key;                  // The user's credentials and master key (calculated on the client).
    var params = {      
        iter: 100000,                          // This number levels the security. Make sure the password hashes in >200ms (check console in browser) to make it hard enough for rainbow attacks to find the password.
        salt: sjcl.random.randomWords(2, 0) }; // The initial salt, used for new registrations only.
    var records = { Data: [] };                // The user's secrets.
    var activePanel = '#signInPanel';          // Default panel.
    var template = $('#itemTemplate').html();  // The mustache template for items

    Opama.Init = function () {
        // Check whether there's a special message sent along by the server.
        if ($('#serverMessage').data('message') !== null) {
            mAlert('#serverMessage', 0);
        }

        // Bind various button and link clicks.
        $('#signInForm').bind('submit', function (event) {
            event.preventDefault();
            show('#waitingPanel');
            throughput = new Date();
            extractCredentials();
            getSalt();
        });
        $('#registerLink').bind('click', function (event) {
            event.preventDefault();
            show('#registerPanel');
        });
        $('#signUpButton').bind('click', function (event) {
            event.preventDefault();
            // Did the user check the 'terms' box?
            if ($('#agreeToTerms').prop('checked') === false) {
                mAlert("You have to agree to the service owner's terms."); // Change this to your desire.
                return;
            }
            if (validateEmail($('#reg_email').val())) {
                // ToDo: Create parameter for level of required password. For now, even an empty password is accepted. (Have it your way!)
                register();
            } else {
                mAlert("You need to enter a valid email address.");
            }
        });
        $('#signInLink').bind('click', function (event) {
            event.preventDefault();
            show('#signInPanel');
        });
        $('#newItemButton').bind('click', function (event) {
            show('#newItemPanel');
        });
        $('#newItemForm').bind('submit', function (event) {
            event.preventDefault();
            encryptAndStore(this);
        });
        $('#records').delegate('div.deleteItemIcon', 'click', function (event) {
            deleteItem($(event.target).data('id'));
        });

        // Initiate password advise popover.
        $('#info_button').popover();
        // Set focus to the sign in e-mail field.
        $('#email').focus();
    };

    // Method for displaying the right panel.
    var show = function (panel) {
        if (panel !== activePanel) {
            $(activePanel).fadeOut(400, function () {
                $(panel).fadeIn();
            });
            activePanel = panel;
        }
    };

    var extractCredentials = function () {
        // Get the user's credentials
        email = $('#email').val();
        password = $('#password').val();

        // Clear the sign-in form
        $('#signInForm').trigger("reset");
    };

    // Get encryption parameters for an e-mail address.
    var getSalt = function () {
        $.ajax({
            url: '/app/getSalt',
            method: 'POST',
            data: { email: email },
            error: function () {
                mAlert('Ajax: Failed to retrieve encryption parameters from server.');
            },
            success: function (data) {
                if (data.success !== false) {
                    $('#signOutLink').fadeIn(400);
                    getUserItems(data);
                } else {
                    mAlert('Server error: Failed to retrieve encryption parameters from server.\n\n' + data.message);
                    show('#signInPanel');
                }
            }
        });
    };

    // Get the user's secrets.
    var getUserItems = function (newParams) {
        if (typeof newParams !== 'undefined') params = JSON.parse(newParams);

        console.time("Hashing master key in");
        key = sjcl.misc.pbkdf2(password, params.salt, params.iter); // Calculate the master key. This should never leave the browser.
        console.timeEnd("Hashing master key in");
        encPassword = sjcl.misc.pbkdf2(key, params.salt); // Hash the password for authentication using the master key.

        $.ajax({
            url: '/secrets/get',
            method: 'POST',
            data: { email: email, encPassword: encPassword.toString() },
            error: function (data) {
                mAlert("Ajax: Error.");
            },
            success: function (data) {
                if (data.success !== false) {
                    // Show the right panel
                    if (data.records.value.length === 0) {
                        show('#newItemPanel');
                    } else {
                        // Clear old records
                        records = { Data: [] };
                        // Decrypt secrets
                        data.records.value.forEach(function (item) {
                            var secret = sjcl.json.decrypt(key, item.value, item.params);
                            secret = JSON.parse(secret);
                            secret.Id = item.id;
                            secret.ItemNumber = records.Data.length + 1;
                            records.Data.push(secret);
                        });
                        render(records);
                    }
                } else {
                    mAlert('User account unknown or disabled or wrong password.');
                    show('#signInPanel');
                }
            }
        });
    };

    var render = function (dataset) {
        var recordsHtml = Mustache.to_html(template, dataset);
        $('#records').html(recordsHtml);

        // Make sure the spinner lasts at least 2 seconds. This makes the app feel more robust and secure... go figure!
        var timeElapsed = new Date() - throughput;
        if (timeElapsed < 1500) timeElapsed = 2000;
        setTimeout(function () {
            show('#recordsPanel');
        }, timeElapsed);

        $('#searchbox').focus();
    };

    // The password field

    // On focus, swap concealed for plain password field
    $("body").on("focusin", $('input.password'), function (e) {
        if ($(e.target).attr('name') === 'PasswordPlaceholder') {
            var brother = document.getElementById('plainPassword_' + $(e.target).data('id'));
            $(e.target).css('display', 'none');
            $(brother).css('display', 'inline');
            $(brother).focus();
        }
    });

    // On focus out, swap plain for concealed password field
    $('body').on('focusout', $('input.password'), function (e) {
        if ($(e.target).attr('name') === 'Password') {
            var sister = document.getElementById('concealedPassword_' + $(e.target).data('id'));
            $(e.target).css('display', 'none');
            $(sister).css('display', 'inline');
        }
    });

    // Passing the item id to the passwordGen 
    $('body').on("click", ".open-passwordGen", function () {
        $("#usePassword").data('id', $(this).data('id'));
    });

    $('#passwordGen').on('show', function () {
        $('#newPassword').val(generatePassword);
    });

    // In- or decreasing the password length
    $('.modal-body').on('click', 'a', function (e) {
        var curLength = $('#pwdLength').html();
        $(e.target).attr('id') === 'incPwdLength' ? curLength++ : curLength--;
        if (curLength < 0 ) curLength = 0;
        $('#pwdLength').html(curLength);
        $('#newPassword').val(generatePassword);
    });

    $('.modal-body').on('click', 'input', function (e) {
        var c = 0;
        if ($('#lCase').is(":checked")) c++;
        if ($('#uCase').is(":checked")) c++;
        if ($('#numbers').is(":checked")) c++;
        if ($('#specials').is(":checked")) c++;
        if ($('#pwdLength').html() === '0') c = 0;
        if (c > 0) {
            $('#usePassword').removeClass('disabled');
            $('#newPassword').val(generatePassword);
        } else {
            $('#newPassword').val('');
            $('#usePassword').addClass('disabled');
        }
    });

    var generatePassword = function () {
        var lowercase = "abcdefghjkmnpqrstuvwxyz", // Excluded ilo
            uppercase = "ABCDEFHJKLMNPQRSTUVWXYZ", // Excluded ILO
            numbers = "23456789", // Excluded 10
            specials = "!@#$%^&*-+=|?<>",
            length = $('#pwdLength').html(),
            charset = "",
            retVal = "";

        if ($('#lCase').is(":checked")) charset += lowercase;
        if ($('#uCase').is(":checked")) charset += uppercase;
        if ($('#numbers').is(":checked")) charset += numbers;
        if ($('#specials').is(":checked")) charset += specials;

        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }

        return retVal;
    };

    $('#usePassword').on('click', function (e) {
        var targetInput = '#plainPassword_' + $(this).data('id');
        var newPassword = $('#newPassword').val();
        $(targetInput).val(newPassword);
        $(targetInput).trigger('change');
        $('#passwordGen').modal('hide');
    });
    // E/o the password field.

    // Event handler for sending field edits to server immediately
    $('#records').delegate('input', 'change', function (event) {
        encryptAndStore(event.target.form, "update");
        if ($(event.target).attr('name') === 'Label') {
            var itemNumber = $(event.target).data('item_number');
            var newLabel = itemNumber + " - " + $(event.target).val();
            $("#records").find("[data-target='#" + $(event.target).data('id') + "']").html(newLabel);
        }
    });
    $('#records').delegate('textarea', 'change', function (event) {
        encryptAndStore(event.target.form, "update");
    });

    // Delete an item
    var deleteItem = function (id) {
        if (confirm("Are you sure you want to delete this item?")) {
            $.ajax({
                url: '/secrets/delete',
                method: 'POST',
                data: { email: email, encPassword: encPassword.toString(), id: id },
                error: function () {
                    mAlert('Ajax: Error...');
                    getUserItems();
                },
                success: function (data) {
                    if (data.success !== true) {
                        mAlert('Server: ' + data.message);
                    } else {
                        // Remove the deleted records from the local array.
                        records.Data = records.Data.filter(function (obj) {
                            return obj.Id !== id;
                        });
                    }
                    render(records);
                }
            });
        }
    };

    // Event handler allowing a user to return to their list w/o signing in again.
    $('.showList').on('click', function (event) {
        event.preventDefault();
        render(records);
    });

    // Listener on the search input that filters realtime.
    $('#searchbox').keyup(function (e) {
        var viewset = { Data: [] },
            searchPhrase = $("#searchbox").val().toLowerCase(); // We're doing case insensitive search

        if (searchPhrase === null) { // The user is probably trying to clear the search results.
            render(records);
            exit;
        }

        for (var i = 0; i < records.Data.length; i++) {
            for (var prop in records.Data[i]) {
                if (records.Data[i][prop] !== null && records.Data[i][prop].toString().toLowerCase().indexOf(searchPhrase) !== -1) {
                    viewset.Data.push(records.Data[i]);
                    break;
                }
            }
        }

        render(viewset);
    });

    // Display an arbitrary alert message for 5 seconds by default. displayTime can be overridden.
    // The #serverMessage message is a special case were the SPA loads with a server message embedded in html.
    mAlert = function (alertMessage, displayTime = 5000) {
        alertMessage === '#serverMessage' ? alertTemplate = '#serverMessage' : alertTemplate = '#message';
        $('#messageContent').html(alertMessage);
        $(alertTemplate).fadeIn('slow');
        if (displayTime > 0) { // Set displayTime to 0 or less to prevent fadeOut.
            setTimeout(function () {
                $(alertTemplate).fadeOut('slow');
            }, displayTime);
        }
    };

    var encryptAndStore = function (form, action) {
        if (typeof action === 'undefined') action = "create";

        // Setup item params using the user's salt and a unique IV per item.
        var itemParams = {
            salt: params.salt,
            iv: sjcl.random.randomWords(4, 0)
            //iter: params.iter // Paranoia mode. Since the master key is pretty long, the default nr of iterations should suffice at the secrets level.
        };

        // Create a JSON object from the form values.
        value = {
            Id: $(form).data('id'),
            ItemNumber:$(form).find('input[name=\'Label\']').data('item_number'),
            Label: $(form).find('input[name=\'Label\']').val(),
            URL: $(form).find('input[name=\'Url\']').val(),
            Username: $(form).find('input[name=\'Username\']').val(),
            Password: $(form).find('input[name=\'Password\']').val(),
            Email: $(form).find('input[name=\'Email\']').val(),
            Remarks: $(form).find('textarea[name=\'Remarks\']').val()
        };

        // Update local records
        var index = records.Data.findIndex( function(o) { return o.Id == value.Id; } );


        records.Data[index] = value;


        // Encrypt item
        value = sjcl.json.encrypt(key, JSON.stringify(value), itemParams);

        // Send it to the server
        $.ajax({
            url: '/secrets/' + action,
            method: 'POST',
            data: {
                email: email,
                encPassword: encPassword.toString(),
                value: value,
                id: $(form).data('id')
            },
            error: function () {
                mAlert('Ajax: Could not save the item...');
            },
            success: function () {
                // On technical success show the user's items.
                mAlert('Your changes have been saved.');
                if (action === "create") {
                    getUserItems();
                    $('#newItemForm')[0].reset();
                }
            }
        });
    };

    function validateEmail(email) {
        // Used with courtesy, check https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript#46181
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    var register = function () {
        console.time("Hashing master key in"); // ToDo: If this drops well below 200ms by Moore's law, up the number of iterations in pbkdf2.
        var key = sjcl.misc.pbkdf2($('#reg_password').val(), params.salt, params.iter);
        console.timeEnd("Hashing master key in");
        var encPassword = sjcl.misc.pbkdf2(key, params.salt);

        // Turn off the password strength meter as we're going to plainly submit the form with the encrypted password in place.
        // ToDo: use 2nd hidden password field for reg_password and introduce plain_password for the strenth meter.
        PasswordStrength.stop();
        $('#reg_password').val(encPassword);
        $('#encParams').val(JSON.stringify({ salt: params.salt, iter: params.iter }, null, 2));

        // Send the form to the server and process the response.
        $.ajax({
            url: '/app/register',
            method: 'POST',
            data: $('#signUpForm').serialize(),
            error: function (data) {
                mAlert(data.message || "Something went terribly wrong.");
            },
            success: function () {
                // Reset salt to allow for more registrations during a single browser session.
                params.salt = sjcl.random.randomWords(2, 0);
                mAlert("Your account has been created successfully. Check you inbox and verify your e-mail address.", 0);
                show('#signInPanel');
            }
        });
    };

    return Opama;
}(Opama || {}));

$(document).ready(function () {
    Opama.Init();
});
