//ToDo Check where this is from. Dropbox has used it in the past too.
var PasswordStrength = {
    PSMInterval: 0,

    start: function () {
        var password_desc = $('#password_strength_desc'),
            info_button = $('#info_button');

        password_desc.innerHTML = '&nbsp;';

        var color_map = [
            "",
            "#c81818",
            "#ffac1d",
            "#a6c060",
            "#27b30f"
        ];

        var word_map = [
            "Very weak",
            "Weak",
            "So-so",
            "Good",
            "Great!"
        ];

        var last_pwd = '';

        var animator = function () {
            var pwd = $("#reg_password").val();
            if (pwd === last_pwd) {
                return;
            }
            last_pwd = pwd;

            var score = PasswordStrength.score(pwd);

            password_desc.css('color', color_map[score]);
            password_desc.text(pwd.length ? word_map[score] : '');

            if (pwd.length && score < 3) {
                info_button.show();
            } else {
                info_button.hide();
            }

            var elm = $('#password_strength');
            elm.css('background-color', color_map[score]);
            if (score === 0) {
                elm.css('width', "0%");
            }
            else {
                elm.css('width', score * 25 + "%");
            }
        };

        this.PSMInterval = setInterval(animator, 350);
    },

    stop: function () {
        clearInterval(this.PSMInterval);
    },

    get_user_inputs: function () {
        var inputs = 'opama online password manager github'.split(); // Add some site-specific words to the zxcvbnm penalty bench...
        fname = $('#fname').val(); // ...and add the user input as well.
        lname = $('#lname').val();
        email = $('#reg_email').val();
        if (fname) {
            inputs.push(fname);
        }
        if (lname) {
            inputs.push(lname);
        }
        if (email) {
            inputs.push(email);
        }
        return inputs;
    },

    score: function (str) {
        if (!window.zxcvbn) {
            return 0; // If zxcvbnm.js hasn't been loaded yet, return a safe 0
        }
        var result = zxcvbn(str, PasswordStrength.get_user_inputs());
        return result.score;
    }
};

// Get zxcvbnm.js (700kB!!!) asynchronously.
(function () {
    var a;
    a = function () {
        var a, b;
        b = document.createElement("script");
        b.src = "/js/zxcvbn.js";
        b.type = "text/javascript";
        b.async = !0;
        a = document.getElementsByTagName("script")[0];
        return a.parentNode.insertBefore(b, a);
    };

    //Check whether the new event handler actually loads the file
    //null !== window.attachEvent ? window.attachEvent("onload", a) : window.addEventListener("load", a, !1);
    window.addEventListener("load", a, !1);

}).call(this);

$(document).ready(function () {
    PasswordStrength.start(); // Start the password strength meter
});
