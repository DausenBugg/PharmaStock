namespace PharmaStock.Dtos.Responses;

public class UsageHistoryResponse
{
    public int UsageHistoryId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public int QuantityChanged { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public DateTime OccurredAtUtc { get; set; }
}
