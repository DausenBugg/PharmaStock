namespace PharmaStock.Dtos.Responses;

public class ExpirationRiskResponse
{
    public int InventoryStockId { get; set; }
    public double RiskScore { get; set; }
    public string RiskLabel { get; set; } = string.Empty;
    public int DaysToExpiry { get; set; }
    public double EstimatedDaysToDeplete { get; set; }
}
