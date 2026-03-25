using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Mappings
{
    public static class InventoryStockMapping
    {
        public static InventoryStockResponse ToInventoryStockResponse(this InventoryStock stock)
        {
            return new InventoryStockResponse
            {
                InventoryStockId = stock.InventoryStockId,
                QuantityOnHand = stock.QuantityOnHand,
                ReorderLevel = stock.ReorderLevel,
                BinLocation = stock.BinLocation,
                LotNumber = stock.LotNumber,
                ExpirationDate = stock.ExpirationDate,
                BeyondUseDate = stock.BeyondUseDate,

                //added package level inventory tracking for the response DTO
                PackageNdc = string.IsNullOrWhiteSpace(stock.PackageNdc) ? null : stock.PackageNdc,
                PackageDescription = stock.PackageDescription
                
            };
        }

        public static InventoryStockListItemResponse ToInventoryStockListItemResponse(this InventoryStock stock)
        {
            return new InventoryStockListItemResponse
            {

                //Inventory stock details for the list item response DTO
                InventoryStockId = stock.InventoryStockId,
                 QuantityOnHand = stock.QuantityOnHand,
                ReorderLevel = stock.ReorderLevel,
                BinLocation = stock.BinLocation,
                LotNumber = stock.LotNumber,
                ExpirationDate = stock.ExpirationDate,
                BeyondUseDate = stock.BeyondUseDate,

                //changed to pull medication details from the Override fields if they exist for the list item response DTO
                // for row level editing in the UI without affecting the underlying medication data for other inventory stock
                // records that reference the same medication
                MedicationId = stock.MedicationId,
                MedicationName = string.IsNullOrWhiteSpace(stock.MedicationNameOverride)
                     ? stock.Medication.Name : stock.MedicationNameOverride,
                GenericName = string.IsNullOrWhiteSpace(stock.GenericNameOverride)
                     ? stock.Medication.GenericName : stock.GenericNameOverride,
                Form = string.IsNullOrWhiteSpace(stock.DosageFormOverride)
                     ? stock.Medication.Form : stock.DosageFormOverride,
                Strength = string.IsNullOrWhiteSpace(stock.StrengthOverride)
                     ? stock.Medication.Strength : stock.StrengthOverride,
                NationalDrugCode = string.IsNullOrWhiteSpace(stock.NationalDrugCodeOverride)
                     ? stock.Medication.NationalDrugCode : stock.NationalDrugCodeOverride,
               

                //added package level inventory tracking for the list item response DTO
                PackageNdc = string.IsNullOrWhiteSpace(stock.PackageNdc) ? null : stock.PackageNdc,
                PackageDescription = stock.PackageDescription
            };
        }
    }
}