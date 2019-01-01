namespace Opama.Models
{
    using Microsoft.EntityFrameworkCore;
    using System;
    //using System.Data.Entity;
    //using System.Data.Entity.Infrastructure;
    
    public partial class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        { }

        public DbSet<Secret> Secrets { get; set; }
        public DbSet<User> Users { get; set; }
    }
}
