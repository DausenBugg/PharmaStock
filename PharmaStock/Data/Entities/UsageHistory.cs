using System;

namespace PharmaStock.Data.Entities
{
    public class UsageHistory
    {
        public int UsageHistoryId { get; set; }

        public int InventoryStockId { get; set; }

        public int MedicationId { get; set; }

        /// <summary>Positive = dispensed/used, Negative = restocked</summary>
        public int QuantityChanged { get; set; }

        public string ChangeType { get; set; } = string.Empty;

        public DateTime OccurredAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public InventoryStock InventoryStock { get; set; } = null!;
        public Medication Medication { get; set; } = null!;
    }
}
