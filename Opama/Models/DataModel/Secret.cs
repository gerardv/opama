using System;

namespace Opama.Models
{
    public partial class Secret
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Value { get; set; }
    
        public virtual User User { get; set; }
    }
}
