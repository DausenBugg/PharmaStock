namespace PharmaStock.Dtos.Responses;

public class MedicationResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NationalDrugCode { get; set; } = string.Empty;
    public string Form { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;

    public List<InventoryStockResponse> Inventory { get; set; } = new();
}
   