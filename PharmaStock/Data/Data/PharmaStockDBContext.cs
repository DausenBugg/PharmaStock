using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data.Entities;

namespace PharmaStock.Data
{
    
    // DBContext is the gateway to the database
    // Inherits from IdentityDbContext to include ASP.NET Core Identity tables
    public class PharmaStockDbContext : IdentityDbContext<IdentityUser>
    {
        public PharmaStockDbContext(DbContextOptions<PharmaStockDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            // Additional Identity configuration can be added here if needed
        }

        // Define DbSets for your entities here (medications, InventoryStock, Users, etc.)
        // Example: 
        // public DbSet<Medication> Medications { get; set; }
        // or DBSet<Medication> Medications => Set<Medication>();

        // Steps for adding a new entity to the DBContext:
        // 1. Create the entity class in the Entities folder (e.g., TestMedication.cs)
        // 2. Add a DbSet property here in the PharmaStockDbContext class
        // 3. Create and apply a new migration to update the database schema
        // 4. Use the new entity in your application code
        // 
        // Fist Verify that you are in your project folder in the terminal
        // Then run the following commands:
        // dotnet ef migrations add (your entity name)Migration
        // dotnet ef database update
        // This will create the necessary table in the database for the new entity
        // To verify, use docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW TABLES;"
        // To remove a migration (if needed), use:
        // dotnet ef migrations remove
        // removes the last migration without applying it to the database
        public DbSet<TestMedication> TestMedications => Set<TestMedication>();

    }
}