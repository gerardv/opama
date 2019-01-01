namespace Opama.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class User
    {
        public User()
        {
            this.Secrets = new HashSet<Secret>();
        }
    
        public Guid Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public bool Disabled { get; set; }
        public string EmailConfirmationCode { get; set; }
        public string EncPassword { get; set; }
        public string EncParams { get; set; }
        public System.DateTime RegisteredOn { get; set; }
    
        public virtual ICollection<Secret> Secrets { get; set; }
    }
}
