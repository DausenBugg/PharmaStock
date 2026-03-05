using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacyTestMedicationsAndSeedInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP TABLE IF EXISTS `TestMedication`;
DROP TABLE IF EXISTS `TestMedications`;
");

            migrationBuilder.Sql(@"
INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Ibuprofen', 'NDC-0001', 'Tablet', '200 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (
    SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0001'
);

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Amoxicillin', 'NDC-0002', 'Capsule', '500 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (
    SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0002'
);

INSERT INTO `Medications` (`Name`, `NationalDrugCode`, `Form`, `Strength`, `Manufacturer`, `CreatedAtUtc`, `UpdatedAtUtc`)
SELECT 'Metformin', 'NDC-0003', 'Tablet', '500 mg', 'PharmaStock Seed', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
WHERE NOT EXISTS (
    SELECT 1 FROM `Medications` WHERE `NationalDrugCode` = 'NDC-0003'
);
");

            migrationBuilder.Sql(@"
INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 120, 40, 'A1', 'LOT-IBU-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 180 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 150 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0001'
AND NOT EXISTS (
    SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-IBU-001'
);

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 65, 35, 'B2', 'LOT-AMOX-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 45 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 30 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0002'
AND NOT EXISTS (
    SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-AMOX-001'
);

INSERT INTO `InventoryStocks` (`MedicationId`, `QuantityOnHand`, `ReorderLevel`, `BinLocation`, `LotNumber`, `ExpirationDate`, `BeyondUseDate`, `UpdatedAtUtc`)
SELECT m.`MedicationId`, 20, 25, 'C4', 'LOT-METF-001', DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 5 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 4 DAY), UTC_TIMESTAMP(6)
FROM `Medications` m
WHERE m.`NationalDrugCode` = 'NDC-0003'
AND NOT EXISTS (
    SELECT 1 FROM `InventoryStocks` s WHERE s.`LotNumber` = 'LOT-METF-001'
);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM `InventoryStocks` WHERE `LotNumber` IN ('LOT-IBU-001', 'LOT-AMOX-001', 'LOT-METF-001');
DELETE FROM `Medications` WHERE `NationalDrugCode` IN ('NDC-0001', 'NDC-0002', 'NDC-0003');
");
        }
    }
}
