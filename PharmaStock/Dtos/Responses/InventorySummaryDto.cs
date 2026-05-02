namespace PharmaStock.Dtos.Responses;

public class InventorySummaryDto
{
    public int TotalItems { get; set; }
    public int Expired { get; set; }
    public int ExpiringSoon { get; set; }
    public int StockedOut { get; set; }
    public int LowInventory { get; set; }
}