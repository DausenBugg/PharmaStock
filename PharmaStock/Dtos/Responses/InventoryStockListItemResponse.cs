namespace PharmaStock.Dtos.Responses;

public class InventoryStockListItemResponse
{
    public int InventoryStockId { get; set; }
    public int MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string Form { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string NationalDrugCode { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public string BinLocation { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public DateTime BeyondUseDate { get; set; }
}