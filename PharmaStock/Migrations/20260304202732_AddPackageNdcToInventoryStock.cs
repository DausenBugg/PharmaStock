using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageNdcToInventoryStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PackageDescription",
                table: "InventoryStocks",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PackageNdc",
                table: "InventoryStocks",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PackageDescription",
                table: "InventoryStocks");

            migrationBuilder.DropColumn(
                name: "PackageNdc",
                table: "InventoryStocks");
        }
    }
}
