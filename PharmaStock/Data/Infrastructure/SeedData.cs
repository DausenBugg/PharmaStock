using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Data.Entities;

namespace PharmaStock.Data.Infrastucture
{
    public static class SeedData
    {
        public static async Task SeedAsync(PharmaStockDbContext db)
        {
            // Ensure DB is reachable and apply any pending migrations
            await db.Database.MigrateAsync();

            // if already seeded, skip
            if (await db.Medications.AnyAsync())
                return;

            var utcNow = DateTime.UtcNow;

            // Helper to safely cap string length for edge-case test data (e.g. max length fields)
            static string Cap(string value, int max) =>
                value.Length <= max ? value : value.Substring(0, max);

            // 10 Medications (all required fields filled; unique NDC)
            var meds = new List<Medication>
            {
                new()
                {
                    Name = "Ibuprofen 200mg",
                    NationalDrugCode = "NDC-00000-0001",
                    Form = "Tablet",
                    Strength = "200 mg",
                    Manufacturer = "Generic Pharma Co"
                },
                new()
                {
                    Name = "Acetaminophen 500mg",
                    NationalDrugCode = "NDC-00000-0002",
                    Form = "Tablet",
                    Strength = "500 mg",
                    Manufacturer = "Generic Pharma Co"
                },
                new()
                {
                    Name = "Amoxicillin 500mg",
                    NationalDrugCode = "NDC-00000-0003",
                    Form = "Capsule",
                    Strength = "500 mg",
                    Manufacturer = "Northwind Laboratories"
                },
                new()
                {
                    Name = "Omeprazole 20mg Delayed-Release",
                    NationalDrugCode = "NDC-00000-0004",
                    Form = "Capsule (DR)",
                    Strength = "20 mg",
                    Manufacturer = "Contoso Therapeutics"
                },
                new()
                {
                    Name = "Lisinopril 10mg",
                    NationalDrugCode = "NDC-00000-0005",
                    Form = "Tablet",
                    Strength = "10 mg",
                    Manufacturer = "Fabrikam Health"
                },
                // Edge: special chars + punctuation
                new()
                {
                    Name = "Children's Cetirizine HCl (Grape) – Sugar-Free",
                    NationalDrugCode = "NDC-00000-0006",
                    Form = "Oral Solution",
                    Strength = "1 mg/mL",
                    Manufacturer = "ACME Rx & Wellness"
                },
                // Edge: near max lengths (Name/Manufacturer)
                new()
                {
                    Name = Cap(new string('N', 200), 200), // exactly 200 chars
                    NationalDrugCode = "NDC-00000-0007",
                    Form = Cap("Topical Gel", 100),
                    Strength = Cap("0.1% w/w", 100),
                    Manufacturer = Cap(new string('M', 200), 200) // exactly 200 chars
                },
                // Edge: weird strength formatting + long form name
                new()
                {
                    Name = "Metformin Extended Release",
                    NationalDrugCode = "NDC-00000-0008",
                    Form = Cap("Tablet – Extended Release (ER)", 100),
                    Strength = Cap("500 mg (ER)", 100),
                    Manufacturer = "Wide World Pharmaceuticals"
                },
                // Edge: hyphens/uppercase + strength with units
                new()
                {
                    Name = "Albuterol Sulfate Inhalation Aerosol",
                    NationalDrugCode = "NDC-00000-0009",
                    Form = "Inhaler",
                    Strength = "90 mcg/actuation",
                    Manufacturer = "Skyline Respiratory"
                },
                // Edge: near max NDC length (still under 50)
                new()
                {
                    Name = "Atorvastatin 40mg",
                    NationalDrugCode = Cap("NDC-EDGE-" + new string('9', 40), 50), // close to 50
                    Form = "Tablet",
                    Strength = "40 mg",
                    Manufacturer = "Blue Yonder Bio"
                }
            };

            db.Medications.AddRange(meds);
            await db.SaveChangesAsync();

            // Build a lookup by NDC to get MedicationIds for the InventoryStock entries below
            var medByNdc = meds.ToDictionary(m => m.NationalDrugCode, m => m.Id);

            // 10 Inventory rows with edge-case coverage
            var stocks = new List<InventoryStock>
            {
                // Normal
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0001"],
                    QuantityOnHand = 50,
                    ReorderLevel = 20,
                    BinLocation = "Back Room",
                    LotNumber = "LOT-IBU-A1",
                    ExpirationDate = utcNow.AddMonths(3),
                    BeyondUseDate = utcNow.AddMonths(2)
                },
                // Normal (second lot)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0001"],
                    QuantityOnHand = 100,
                    ReorderLevel = 20,
                    BinLocation = "Shelf A1",
                    LotNumber = "LOT-IBU-B1",
                    ExpirationDate = utcNow.AddMonths(6),
                    BeyondUseDate = utcNow.AddMonths(5)
                },
                // Edge: QuantityOnHand = 0 (out of stock)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0002"],
                    QuantityOnHand = 0,
                    ReorderLevel = 25,
                    BinLocation = "Shelf B2",
                    LotNumber = "LOT-ACE-ZERO",
                    ExpirationDate = utcNow.AddMonths(8),
                    BeyondUseDate = utcNow.AddMonths(7)
                },
                // Edge: ReorderLevel = 0 (never reorder)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0003"],
                    QuantityOnHand = 35,
                    ReorderLevel = 0,
                    BinLocation = "Shelf C3",
                    LotNumber = "LOT-AMOX-000",
                    ExpirationDate = utcNow.AddMonths(10),
                    BeyondUseDate = utcNow.AddMonths(9)
                },
                // Edge: ReorderLevel > QuantityOnHand (should flag “low stock” logic later)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0004"],
                    QuantityOnHand = 5,
                    ReorderLevel = 30,
                    BinLocation = "Shelf D4",
                    LotNumber = "LOT-OME-LOW",
                    ExpirationDate = utcNow.AddMonths(4),
                    BeyondUseDate = utcNow.AddMonths(3)
                },
                // Edge: Expired (past expiration)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0005"],
                    QuantityOnHand = 12,
                    ReorderLevel = 10,
                    BinLocation = "Quarantine",
                    LotNumber = "LOT-LIS-EXP",
                    ExpirationDate = utcNow.AddDays(-10),
                    BeyondUseDate = utcNow.AddDays(-20)
                },
                // Edge: Expiration today
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0006"],
                    QuantityOnHand = 18,
                    ReorderLevel = 15,
                    BinLocation = "Shelf Kids",
                    LotNumber = "LOT-CET-TODAY",
                    ExpirationDate = utcNow.Date,             // today
                    BeyondUseDate = utcNow.Date.AddDays(-1)    // BUD already passed (edge)
                },
                // Edge: very far future dates
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0007"],
                    QuantityOnHand = 999,
                    ReorderLevel = 100,
                    BinLocation = "Overflow",
                    LotNumber = "LOT-EDGE-FUTURE",
                    ExpirationDate = utcNow.AddYears(10),
                    BeyondUseDate = utcNow.AddYears(9)
                },
                // Edge: long-ish bin/lot strings (still under 100)
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0008"],
                    QuantityOnHand = 60,
                    ReorderLevel = 50,
                    BinLocation = "Bin-" + new string('B', 90), // 94 chars total-ish, under 100
                    LotNumber = "LOT-" + new string('L', 96),   // under 100
                    ExpirationDate = utcNow.AddMonths(14),
                    BeyondUseDate = utcNow.AddMonths(13)
                },
                // Normal
                new()
                {
                    MedicationId = medByNdc["NDC-00000-0009"],
                    QuantityOnHand = 22,
                    ReorderLevel = 10,
                    BinLocation = "Respiratory",
                    LotNumber = "LOT-ALB-001",
                    ExpirationDate = utcNow.AddMonths(12),
                    BeyondUseDate = utcNow.AddMonths(11)
                },
            };

            // Inventory for the last medication (near-50 NDC) - keep total inventory rows = 10
            stocks.Add(new InventoryStock
            {
                MedicationId = medByNdc[meds.Last().NationalDrugCode],
                QuantityOnHand = 40,
                ReorderLevel = 20,
                BinLocation = "Shelf Statins",
                LotNumber = "LOT-ATOR-040",
                ExpirationDate = utcNow.AddMonths(18),
                BeyondUseDate = utcNow.AddMonths(17)
            });

            db.InventoryStocks.AddRange(stocks);
            await db.SaveChangesAsync();
        }

        // Teriminal check to verify seeding worked 
        // After running the app, you can use the following command to check the counts in MySQL:
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SELECT COUNT(*) FROM Medications; SELECT COUNT(*) FROM InventoryStocks;"
        // You should see 10 for Medications and 11 (this is for the edge case normal second lot number) for InventoryStocks, confirming that the seeding was successful.
        // To check the Med table:  docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SELECT * FROM Medications;"


        // Validation of the FK relationship (each InventoryStock's MedicationId should exist in Medications)
        // Should fail to insert 
        // Blocking invalid insert
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; INSERT INTO InventoryStocks (MedicationId, QuantityOnHand, ReorderLevel, BinLocation, LotNumber, ExpirationDate, BeyondUseDate, UpdatedAtUtc) VALUES (999999, 1, 1, 'TEST', 'TEST-FK-FAIL', NOW(6), NOW(6), NOW(6));"
        // Blocking invalid update
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; UPDATE InventoryStocks SET MedicationId = 999999 WHERE Id = 1;"

        // Testing passed - FK constraints are working as expected (insertion/update with non-existent MedicationId fails)

        // Checking cascade delete (deleting a Medication should delete related InventoryStock rows)
        // First, check the current counts for a specific Medication and its InventoryStocks
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SELECT COUNT(*) AS StocksForMed1 FROM InventoryStocks WHERE MedicationId = 1;"
        // Then delete the Medication with Id = 1
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; DELETE FROM Medications WHERE Id = 1;"
        // Finally, check the InventoryStocks count again for MedicationId = 1 (should be 0 if cascade delete worked)
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "USE pharmastockdb; SELECT COUNT(*) AS StocksForMed1_After FROM InventoryStocks WHERE MedicationId = 1;"

        // Testing passed - cascade delete is working as expected (deleting a Medication also deletes related InventoryStock rows)

        // Reseeding the database (if needed) can be done by re-running the app (which will check if data exists and skip seeding if it does). To force reseeding, you can either:
        // docker exec -it pharmastock-mysql mysql -u dev -padim -e "DROP DATABASE pharmastockdb; CREATE DATABASE pharmastockdb;"
        // dotnet ef database update
        // This will clear all data and allow the seeding to run again on app startup.
        // 

    }
}
