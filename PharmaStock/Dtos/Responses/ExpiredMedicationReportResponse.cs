namespace PharmaStock.Dtos.Responses
{
    public class ExpiredMedicationReportResponseDto
    {
        public int InventoryStockId { get; set; }
        public int MedicationId { get; set; }
        public string MedicationName { get; set; } = string.Empty;
        public string? GenericName { get; set; }
        public string NationalDrugCode { get; set; } = string.Empty;
        public string? PackageNdc { get; set; }
        public string? PackageDescription { get; set; }
       public string LotNumber { get; set; } = string.Empty;
        public DateTime ExpirationDate { get; set; }
        public int QuantityOnHand { get; set; }
        public string BinLocation { get; set; } = string.Empty;
    }
}