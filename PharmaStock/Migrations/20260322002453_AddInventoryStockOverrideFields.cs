using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryStockOverrideFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DosageFormOverride",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "GenericNameOverride",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MedicationNameOverride",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "NationalDrugCodeOverride",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StrengthOverride",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DosageFormOverride",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "GenericNameOverride",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "MedicationNameOverride",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "NationalDrugCodeOverride",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "StrengthOverride",
                table: "InventoryStocks");
        }
    }
}
