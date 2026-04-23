using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaStock.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExpirationWarningDays = table.Column<int>(type: "int", nullable: false),
                    LowStockThresholdPercent = table.Column<int>(type: "int", nullable: false),
                    RiskScoreCriticalThreshold = table.Column<double>(type: "double", nullable: false),
                    RiskScoreWarningThreshold = table.Column<double>(type: "double", nullable: false),
                    MinRiskScoreFilter = table.Column<double>(type: "double", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationSettings", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "NotificationSettings",
                columns: new[] { "Id", "ExpirationWarningDays", "LowStockThresholdPercent", "MinRiskScoreFilter", "RiskScoreCriticalThreshold", "RiskScoreWarningThreshold", "UpdatedAtUtc" },
                values: new object[] { 1, 30, 20, 0.25, 0.75, 0.5, new DateTime(2026, 4, 17, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationSettings");
        }
    }
}
