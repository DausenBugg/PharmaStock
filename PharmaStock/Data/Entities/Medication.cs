using System;
using System.Collections.Generic;
namespace PharmaStock.Data.Entities

{

    public class Medication
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string NationalDrugCode { get; set; } = string.Empty;

        public string Form { get; set; } = string.Empty;

        public string Strength { get; set; } = string.Empty;

        public string Manufacturer { get; set; } = string.Empty;

        public DateTime CreatedAtUtc { get; set; }

        public DateTime UpdatedAtUtc { get; set; }

      public ICollection<InventoryStock> InventoryStocks { get; set; } = new List<InventoryStock>();
        
    }
}