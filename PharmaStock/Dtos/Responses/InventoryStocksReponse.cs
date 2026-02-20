namespace PharmaStock.Dtos.Responses;

public class InventoryStockResponse
{
    public int InventoryStockId { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public string BinLocation { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public DateTime BeyondUseDate { get; set; }
}