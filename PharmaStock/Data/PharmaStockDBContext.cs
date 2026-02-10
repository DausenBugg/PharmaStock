using Microsoft.EntityFrameworkCore;
using PharmaStock.Data.Entities;

namespace PharmaStock.Data
{
    
    // DBContext is the gateway to the database
    public class PharmaStockDbContext : DbContext
    {
        public PharmaStockDbContext(DbContextOptions<PharmaStockDbContext> options) : base(options)
        {
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
        public DbSet<Medication> Medications { get; set; } = null!;
        public DbSet<InventoryStock> InventoryStocks { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<InventoryStock>()
                .HasOne(i => i.Medication)
                .WithMany(m => m.InventoryStocks)
                .HasForeignKey(i => i.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
        }


    }
}