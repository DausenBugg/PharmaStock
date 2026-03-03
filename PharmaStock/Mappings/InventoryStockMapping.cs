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
                BeyondUseDate = stock.BeyondUseDate
            };
        }

        public static InventoryStockListItemResponse ToInventoryStockListItemResponse(this InventoryStock stock)
        {
            return new InventoryStockListItemResponse
            {
                InventoryStockId = stock.InventoryStockId,
                MedicationId = stock.MedicationId,
                MedicationName = stock.Medication.Name,
                Form = stock.Medication.Form,
                Strength = stock.Medication.Strength,
                NationalDrugCode = stock.Medication.NationalDrugCode,
                QuantityOnHand = stock.QuantityOnHand,
                ReorderLevel = stock.ReorderLevel,
                BinLocation = stock.BinLocation,
                LotNumber = stock.LotNumber,
                ExpirationDate = stock.ExpirationDate,
                BeyondUseDate = stock.BeyondUseDate
            };
        }
    }
}