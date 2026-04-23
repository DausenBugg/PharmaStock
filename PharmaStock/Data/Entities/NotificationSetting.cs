using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Data.Entities;

public class NotificationSetting
{
    [Key]
    public int Id { get; set; }

    public int ExpirationWarningDays { get; set; } = 30;

    public int LowStockThresholdPercent { get; set; } = 20;

    public double RiskScoreCriticalThreshold { get; set; } = 0.75;

    public double RiskScoreWarningThreshold { get; set; } = 0.50;

    public double MinRiskScoreFilter { get; set; } = 0.25;

    public DateTime UpdatedAtUtc { get; set; }
}
