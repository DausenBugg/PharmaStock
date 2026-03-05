using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class MakePackageNdcNullableAndUniquePerMedication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PackageNdc",
                table: "InventoryStocks",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql(
                @"UPDATE InventoryStocks SET PackageNdc = NULL WHERE PackageNdc = '';");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryStocks_MedicationId_PackageNdc",
                table: "InventoryStocks",
                columns: new[] { "MedicationId", "PackageNdc" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InventoryStocks_MedicationId_PackageNdc",
                table: "InventoryStocks");

            migrationBuilder.Sql("UPDATE InventoryStocks SET PackageNdc = '' WHERE PackageNdc IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "PackageNdc",
                table: "InventoryStocks",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
