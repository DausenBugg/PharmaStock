using System;
namespace PharmaStock.Data.Entities
{
    public class InventoryStock
    {
        public int Id { get; set; }

        public int MedicationId { get; set; }

        public int QuantityOnHand { get; set; }

         public int ReorderLevel { get; set; }

        public string BinLocation { get; set; } = string.Empty;

         public string LotNumber { get; set; } = string.Empty;

        public DateTime ExpirationDate { get; set; }

        public DateTime BeyondUseDate { get; set; }

        public DateTime UpdatedAtUtc { get; set; }

        // Navigation property to Medication
        public Medication Medication { get; set; } = null!;

    }
}

