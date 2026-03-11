using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class AddUsageHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UsageHistories",
                columns: table => new
                {
                    UsageHistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    InventoryStockId = table.Column<int>(type: "int", nullable: false),
                    MedicationId = table.Column<int>(type: "int", nullable: false),
                    QuantityChanged = table.Column<int>(type: "int", nullable: false),
                    ChangeType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OccurredAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageHistories", x => x.UsageHistoryId);
                    table.ForeignKey(
                        name: "FK_UsageHistories_InventoryStocks_InventoryStockId",
                        column: x => x.InventoryStockId,
                        principalTable: "InventoryStocks",
                        principalColumn: "InventoryStockId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsageHistories_Medications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "Medications",
                        principalColumn: "MedicationId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UsageHistories_InventoryStockId",
                table: "UsageHistories",
                column: "InventoryStockId");

            migrationBuilder.CreateIndex(
                name: "IX_UsageHistories_MedicationId_OccurredAtUtc",
                table: "UsageHistories",
                columns: new[] { "MedicationId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UsageHistories");
        }
    }
}
