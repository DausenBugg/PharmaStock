using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class AlignMigrationSeedWithSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM `InventoryStocks` WHERE `LotNumber` IN ('LOT-IBU-001', 'LOT-AMOX-001', 'LOT-METF-001');
DELETE FROM `Medications` WHERE `NationalDrugCode` IN ('NDC-0001', 'NDC-0002', 'NDC-0003');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Ibuprofen 200mg', 'NDC-00000-0001', 'Tablet', '200 mg', 'Generic Pharma Co', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0001');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Acetaminophen 500mg', 'NDC-00000-0002', 'Tablet', '500 mg', 'Generic Pharma Co', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0002');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Amoxicillin 500mg', 'NDC-00000-0003', 'Capsule', '500 mg', 'Northwind Laboratories', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0003');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Omeprazole 20mg Delayed-Release', 'NDC-00000-0004', 'Capsule (DR)', '20 mg', 'Contoso Therapeutics', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0004');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Lisinopril 10mg', 'NDC-00000-0005', 'Tablet', '10 mg', 'Fabrikam Health', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0005');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Children''s Cetirizine HCl (Grape) – Sugar-Free', 'NDC-00000-0006', 'Oral Solution', '1 mg/mL', 'ACME Rx & Wellness', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0006');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT REPEAT('N', 200), 'NDC-00000-0007', 'Topical Gel', '0.1% w/w', REPEAT('M', 200), UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0007');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Metformin Extended Release', 'NDC-00000-0008', 'Tablet – Extended Release (ER)', '500 mg (ER)', 'Wide World Pharmaceuticals', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0008');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Albuterol Sulfate Inhalation Aerosol', 'NDC-00000-0009', 'Inhaler', '90 mcg/actuation', 'Skyline Respiratory', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-00000-0009');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Atorvastatin 40mg', CONCAT('NDC-EDGE-', REPEAT('9', 40)), 'Tablet', '40 mg', 'Blue Yonder Bio', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = CONCAT('NDC-EDGE-', REPEAT('9', 40)));

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 50, 20, 'Back Room', 'LOT-IBU-A1', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 3 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 2 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0001'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-IBU-A1');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 100, 20, 'Shelf A1', 'LOT-IBU-B1', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 6 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 5 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0001'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-IBU-B1');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 0, 25, 'Shelf B2', 'LOT-ACE-ZERO', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 8 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 7 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0002'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-ACE-ZERO');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 35, 0, 'Shelf C3', 'LOT-AMOX-000', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 10 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 9 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0003'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-AMOX-000');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 5, 30, 'Shelf D4', 'LOT-OME-LOW', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 4 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 3 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0004'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-OME-LOW');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 12, 10, 'Quarantine', 'LOT-LIS-EXP', DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 DAY), DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 20 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0005'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-LIS-EXP');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 18, 15, 'Shelf Kids', 'LOT-CET-TODAY', UTC_DATE(), DATE_SUB(UTC_DATE(), INTERVAL 1 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0006'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-CET-TODAY');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 999, 100, 'Overflow', 'LOT-EDGE-FUTURE', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 10 YEAR), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 9 YEAR), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0007'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-EDGE-FUTURE');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 60, 50, CONCAT('Bin-', REPEAT('B', 90)), CONCAT('LOT-', REPEAT('L', 96)), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 14 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 13 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0008'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = CONCAT('LOT-', REPEAT('L', 96)));

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 22, 10, 'Respiratory', 'LOT-ALB-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 12 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 11 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-00000-0009'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-ALB-001');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 40, 20, 'Shelf Statins', 'LOT-ATOR-040', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 18 MONTH), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 17 MONTH), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = CONCAT('NDC-EDGE-', REPEAT('9', 40))
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-ATOR-040');
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM `InventoryStocks` WHERE `LotNumber` IN (
    'LOT-IBU-A1',
    'LOT-IBU-B1',
    'LOT-ACE-ZERO',
    'LOT-AMOX-000',
    'LOT-OME-LOW',
    'LOT-LIS-EXP',
    'LOT-CET-TODAY',
    'LOT-EDGE-FUTURE',
    CONCAT('LOT-', REPEAT('L', 96)),
    'LOT-ALB-001',
    'LOT-ATOR-040'
);

DELETE FROM `Medications` WHERE `NationalDrugCode` IN (
    'NDC-00000-0001',
    'NDC-00000-0002',
    'NDC-00000-0003',
    'NDC-00000-0004',
    'NDC-00000-0005',
    'NDC-00000-0006',
    'NDC-00000-0007',
    'NDC-00000-0008',
    'NDC-00000-0009',
    CONCAT('NDC-EDGE-', REPEAT('9', 40))
);

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Ibuprofen', 'NDC-0001', 'Tablet', '200 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0001');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Amoxicillin', 'NDC-0002', 'Capsule', '500 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0002');

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Metformin', 'NDC-0003', 'Tablet', '500 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0003');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 120, 40, 'A1', 'LOT-IBU-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 180 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 150 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0001'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-IBU-001');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 65, 35, 'B2', 'LOT-AMOX-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 45 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 30 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0002'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-AMOX-001');

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 20, 25, 'C4', 'LOT-METF-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 5 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 4 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0003'
AND NOT EXISTS (SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-METF-001');
");
        }
    }
}
