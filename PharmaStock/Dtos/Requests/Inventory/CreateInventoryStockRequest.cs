using System;
using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Dtos.Requests.Inventory
{
    public class CreateInventoryStockDto
    {
        [Required]
        public int MedicationId { get; set; }

        [Range(0, int.MaxValue)]
        public int QuantityOnHand { get; set; }

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; }

        [Required, StringLength(100, MinimumLength = 1)]
        public string BinLocation { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 1)]
        public string LotNumber { get; set; } = string.Empty;

        [Required]
        public DateTime ExpirationDate { get; set; }

        [Required]
        public DateTime BeyondUseDate { get; set; }

        // packaging NDC inputs for data integrity
        public string PackageNdc { get; set; } = string.Empty;
        public string? PackageDescription { get; set; }
    }
}
