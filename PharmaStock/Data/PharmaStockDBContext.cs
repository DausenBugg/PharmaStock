using Microsoft.EntityFrameworkCore;
using PharmaStock.Data.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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

            // Relationship configuration between InventoryStock and Medication
            modelBuilder.Entity<InventoryStock>()
                .HasOne(i => i.Medication)
                .WithMany(m => m.InventoryStocks)
                .HasForeignKey(i => i.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Medication constraints and indexes
            modelBuilder.Entity<Medication>(entity =>
            {
                entity.Property(m => m.Name)
                    .IsRequired()
                    .HasMaxLength(200);
                entity.Property(m => m.NationalDrugCode)
                    .IsRequired()
                    .HasMaxLength(50);
                entity.Property(m => m.Form)
                    .HasMaxLength(100);
                entity.Property(m => m.Strength)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(m => m.Manufacturer)
                    .HasMaxLength(200); 

                // Unique index on NationalDrugCode to prevent duplicates
                entity.HasIndex(m => m.NationalDrugCode)
                    .IsUnique();

            });

            // InventoryStock constraints and indexes
            modelBuilder.Entity<InventoryStock>(entity =>
            {
                entity.Property(i => i.BinLocation)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(i => i.LotNumber)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(i => i.QuantityOnHand)
                    .IsRequired();
                entity.Property(i => i.ReorderLevel)
                    .IsRequired();
                
                // Index on MedicationId for faster lookups
                entity.HasIndex(i => i.MedicationId);
            }); 
        }

        // Override SaveChanges for synchronous calls
        public override int SaveChanges()
        {
            ApplyTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyTimestamps()
        {
            var utcNow = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is Medication med)
                {
                    if (entry.State == EntityState.Added)
                    {
                        med.CreatedAtUtc = utcNow;
                        med.UpdatedAtUtc = utcNow;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        med.UpdatedAtUtc = utcNow;
                    }
                }

                if (entry.Entity is InventoryStock stock)
                {
                    if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
                    {
                        stock.UpdatedAtUtc = utcNow;
                    }
                }
            }
        }

        // Terminal checks to verify that the DBContext is properly configured and can connect to the database:
        //  docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW COLUMNS FROM Medications;
        //  docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW INDEX FROM Medications;"
        //  docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW INDEX FROM InventoryStocks;"
        //  docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SHOW CREATE TABLE InventoryStocks\G"
    }
}