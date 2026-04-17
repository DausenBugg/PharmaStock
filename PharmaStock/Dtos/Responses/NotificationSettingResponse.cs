namespace PharmaStock.Dtos.Responses;

public class NotificationSettingResponse
{
    public int ExpirationWarningDays { get; set; }
    public int LowStockThresholdPercent { get; set; }
    public double RiskScoreCriticalThreshold { get; set; }
    public double RiskScoreWarningThreshold { get; set; }
    public double MinRiskScoreFilter { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
