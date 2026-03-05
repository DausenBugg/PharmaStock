using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Mappings
{
    

    public static class MedicationMapping
    {
        public static MedicationResponse ToMedicationResponse(this Medication medication)
        {
            return new MedicationResponse
            {
                MedicationId = medication.MedicationId,
                Name = medication.Name,
                GenericName = medication.GenericName,
                NationalDrugCode = medication.NationalDrugCode,
                Form = medication.Form,
                Strength = medication.Strength,
                Manufacturer = medication.Manufacturer,
                Inventory = medication.InventoryStocks
                    .Select(s => s.ToInventoryStockResponse())
                    .ToList()
            };
        }
    }
}