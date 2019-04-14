using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Opama.Configuration
{
    public class AppSettings
    {
        /// <summary>
        /// Hostname of the email server.
        /// </summary>
        public string MailHost { get; set; }


        /// <summary>
        /// Email From:
        /// </summary>
        public string SendFrom { get; set; }
    }
}
