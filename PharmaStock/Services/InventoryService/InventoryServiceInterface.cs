using PharmaStock.Dtos.Requests.Inventory;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services
{
    public interface InventoryStockServiceInterface
    {
        
        Task<IEnumerable<InventoryStockResponse>> GetInventoryStocksAsync();
        Task<List<InventoryStockListItemResponse>> GetInStockListAsync();
        Task<InventoryStockResponse> GetInventoryStockByIdAsync(int inventoryStockId);
        Task<InventoryStockResponse> AdjustInventoryStockAsync(int inventoryStockId, InventoryAdjustQuantityRequest request);
        Task<InventoryStockResponse> CreateInventoryStockAsync(CreateInventoryStockDto request);
        Task<InventoryStockResponse> UpdateExpirationDateAsync(int inventoryStockId, UpdatePatchExpirationDateRequest request);
        Task<InventoryStockResponse> UpdateBeyondUseDateAsync(int inventoryStockId, UpdatePatchBUDRequest request);
        Task<InventoryStockResponse> UpdatePackageNdcAsync(int inventoryStockId, UpdatePackageNdcRequest request);
        Task<InventoryStockResponse> UpdatePackageDescriptionAsync(int inventoryStockId, UpdatePackageDescriptionRequest request);
    }
}