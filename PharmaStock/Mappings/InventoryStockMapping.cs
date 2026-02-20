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
    }
}