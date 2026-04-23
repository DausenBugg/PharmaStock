using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data.Entities;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PharmaStock.Data
{
    
    // DBContext is the gateway to the database
    public class PharmaStockDbContext : IdentityDbContext<IdentityUser>
    {
        public PharmaStockDbContext(DbContextOptions<PharmaStockDbContext> options) : base(options)
        {
        }

        // Define DbSets for your entities here (medications, InventoryStock, Users, etc.)
        // Example: 
        // public DbSet<Medication> Medications { get; set; }
        // or DBSet<Medication> Medications => Set<Medication>();

        // Steps for adding a new entity to the DBContext:
        // 1. Create the entity class in the Entities folder (e.g., Medication.cs)
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
        public DbSet<UsageHistory> UsageHistories { get; set; } = null!;
        public DbSet<NotificationSetting> NotificationSettings { get; set; } = null!;

        // UserProfile is a separate entity linked to IdentityUser via UserId
        public DbSet<UserProfile> UserProfiles { get; set; } = null!;

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
                entity.Property(m => m.GenericName)
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
                entity.Property(i => i.PackageNdc)
                    .HasMaxLength(20)
                    .HasColumnType("varchar(20)"); // Use varchar for NDC to prevent unnecessary padding

                // set PackageNdc as unique to prevent duplicate package entries in inventory
                entity.HasIndex(i => new { i.MedicationId, i.PackageNdc } ) 
                    .IsUnique();
                    
                // Index on MedicationId for faster lookups
                entity.HasIndex(i => i.MedicationId);
            }); 

            // UsageHistory configuration
            modelBuilder.Entity<UsageHistory>(entity =>
            {
                entity.HasOne(u => u.InventoryStock)
                    .WithMany()
                    .HasForeignKey(u => u.InventoryStockId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(u => u.Medication)
                    .WithMany()
                    .HasForeignKey(u => u.MedicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(u => u.ChangeType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.QuantityChanged)
                    .IsRequired();

                entity.Property(u => u.OccurredAtUtc)
                    .IsRequired();

                // Composite index for ML queries: filter by medication, order by time
                entity.HasIndex(u => new { u.MedicationId, u.OccurredAtUtc });
            });

            // UserProfile configuration
            modelBuilder.Entity<UserProfile>(entity =>
            {
                entity.HasIndex(p => p.UserId)
                    .IsUnique();

                entity.Property(p => p.DisplayName)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(p => p.ProfileImageContentType)
                    .HasMaxLength(100);

                entity.Property(p => p.Bio)
                    .HasMaxLength(1000);

                entity.HasOne(p => p.User)
                    .WithOne()
                    .HasForeignKey<UserProfile>(p => p.UserId)
                    .HasPrincipalKey<IdentityUser>(u => u.Id)
                    .OnDelete(DeleteBehavior.Cascade);
            // Seed default notification settings (single-row config)
            modelBuilder.Entity<NotificationSetting>().HasData(new NotificationSetting
            {
                Id = 1,
                ExpirationWarningDays = 30,
                LowStockThresholdPercent = 20,
                RiskScoreCriticalThreshold = 0.75,
                RiskScoreWarningThreshold = 0.50,
                MinRiskScoreFilter = 0.25,
                UpdatedAtUtc = new DateTime(2026, 4, 17, 0, 0, 0, DateTimeKind.Utc)
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

                if (entry.Entity is UsageHistory usage)
                {
                    if (entry.State == EntityState.Added)
                    {
                        usage.CreatedAtUtc = utcNow;
                    }
                }

                if (entry.Entity is NotificationSetting ns)
                {
                    if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
                    {
                        ns.UpdatedAtUtc = utcNow;
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