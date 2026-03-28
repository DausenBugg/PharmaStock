using PharmaStock.Dtos.Requests.Inventory;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services
{
    public interface InventoryStockServiceInterface
    {
        
        Task<IEnumerable<InventoryStockResponse>> GetInventoryStocksAsync();
        Task<PagedResponse<InventoryStockListItemResponse>> GetInStockListAsync(PaginationRequestDto request);
        Task<InventoryStockResponse> GetInventoryStockByIdAsync(int inventoryStockId);
        Task<InventoryStockResponse> AdjustInventoryStockAsync(int inventoryStockId, InventoryAdjustQuantityRequest request);
        Task<InventoryStockResponse> CreateInventoryStockAsync(CreateInventoryStockDto request);
        Task<InventoryStockResponse> UpdateExpirationDateAsync(int inventoryStockId, UpdatePatchExpirationDateRequest request);
        Task<InventoryStockResponse> UpdateBeyondUseDateAsync(int inventoryStockId, UpdatePatchBUDRequest request);
        Task<InventoryStockResponse> UpdatePackageNdcAsync(int inventoryStockId, UpdatePackageNdcRequest request);
        Task<InventoryStockResponse> UpdatePackageDescriptionAsync(int inventoryStockId, UpdatePackageDescriptionRequest request);

        // adding override fields for editing at the row level in the UI for Medication
        Task<InventoryStockResponse> UpdateMedicationNameOverrideAsync(int inventoryStockId, UpdateMedicationNameOverrideRequest request);
        Task<InventoryStockResponse> UpdateGenericNameOverrideAsync(int inventoryStockId, UpdateGenericNameOverrideRequest request);
        Task<InventoryStockResponse> UpdateNationalDrugCodeOverrideAsync(int inventoryStockId, UpdateNationalDrugCodeOverrideRequest request);
        Task<InventoryStockResponse> UpdateStrengthOverrideAsync(int inventoryStockId, UpdateStrengthOverrideRequest request);
        Task<InventoryStockResponse> UpdateDosageFormOverrideAsync(int inventoryStockId, UpdateDosageFormOverrideRequest request);
    }
    
}