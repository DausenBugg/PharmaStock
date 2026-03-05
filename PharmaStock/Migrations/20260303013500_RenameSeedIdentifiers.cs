using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class RenameSeedIdentifiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-0001'
    WHERE `NationalDrugCode` = 'NDC-SEED-0001';

    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-0002'
    WHERE `NationalDrugCode` = 'NDC-SEED-0002';

    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-0003'
    WHERE `NationalDrugCode` = 'NDC-SEED-0003';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'LOT-IBU-001'
    WHERE `LotNumber` = 'SEED-LOT-IBU-001';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'LOT-AMOX-001'
    WHERE `LotNumber` = 'SEED-LOT-AMOX-001';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'LOT-METF-001'
    WHERE `LotNumber` = 'SEED-LOT-METF-001';
    ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-SEED-0001'
    WHERE `NationalDrugCode` = 'NDC-0001';

    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-SEED-0002'
    WHERE `NationalDrugCode` = 'NDC-0002';

    UPDATE `Medications`
    SET `NationalDrugCode` = 'NDC-SEED-0003'
    WHERE `NationalDrugCode` = 'NDC-0003';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'SEED-LOT-IBU-001'
    WHERE `LotNumber` = 'LOT-IBU-001';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'SEED-LOT-AMOX-001'
    WHERE `LotNumber` = 'LOT-AMOX-001';

    UPDATE `InventoryStocks`
    SET `LotNumber` = 'SEED-LOT-METF-001'
    WHERE `LotNumber` = 'LOT-METF-001';
    ");
        }
    }
}
