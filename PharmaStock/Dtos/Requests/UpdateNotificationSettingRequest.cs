using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Dtos.Requests;

public class UpdateNotificationSettingRequest
{
    [Range(1, 365)]
    public int ExpirationWarningDays { get; set; }

    [Range(0, 100)]
    public int LowStockThresholdPercent { get; set; }

    [Range(0.01, 1.0)]
    public double RiskScoreCriticalThreshold { get; set; }

    [Range(0.01, 1.0)]
    public double RiskScoreWarningThreshold { get; set; }

    [Range(0.0, 1.0)]
    public double MinRiskScoreFilter { get; set; }
}
