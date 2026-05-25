namespace PharmaStock.Dtos.Responses;

public class InventoryStockListItemResponse
{
    public int InventoryStockId { get; set; }
    public int MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Form { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string NationalDrugCode { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public string BinLocation { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public DateTime BeyondUseDate { get; set; }

    //added package level inventory tracking for the list item response DTO
    public string? PackageNdc { get; set; } = string.Empty;
    public string? PackageDescription { get; set; }

    public string? MedicationNameOverride { get; set; }
    public string? GenericNameOverride { get; set; }
    public string? NationalDrugCodeOverride { get; set; }
    public string? StrengthOverride { get; set; }
    public string? DosageFormOverride { get; set; }
}