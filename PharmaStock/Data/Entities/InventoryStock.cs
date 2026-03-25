using System;
namespace PharmaStock.Data.Entities
{
    public class InventoryStock
    {
        public int InventoryStockId { get; set; }

        public int MedicationId { get; set; }

        public int QuantityOnHand { get; set; }

         public int ReorderLevel { get; set; }

        public string BinLocation { get; set; } = string.Empty;

         public string LotNumber { get; set; } = string.Empty;

        public DateTime ExpirationDate { get; set; }

        public DateTime BeyondUseDate { get; set; }

        public DateTime UpdatedAtUtc { get; set; }

        //added package level inventory tracking for the data model
        public string? PackageNdc { get; set; } = string.Empty;
        public string? PackageDescription { get; set; }

        // Navigation property to Medication
        public Medication Medication { get; set; } = null!;

        // adding override fields for editing at the row level in the UI for Medication
        public string? MedicationNameOverride { get; set; }
        public string? GenericNameOverride { get; set; }
        public string? NationalDrugCodeOverride { get; set; }
         public string? StrengthOverride { get; set; }
         public string? DosageFormOverride { get; set; }
    }
}

