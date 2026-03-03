using PharmaStock.Dtos.Requests.Inventory;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services
{
    public interface InventoryStockServiceInterface
    {
        Task<List<InventoryStockResponse>> GetAllInventoryStockAsync();
        Task<InventoryStockResponse> GetInventoryStockByIdAsync(int inventoryStockId);
        Task<InventoryStockResponse> AdjustInventoryStockAsync(int inventoryStockId, InventoryAdjustQuantityRequest request);
        Task<InventoryStockResponse> CreateInventoryStockAsync(CreateInventoryStockDto request);

    }
}