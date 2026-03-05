using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Dtos.Requests.Inventory;
using PharmaStock.Dtos.Responses;
using PharmaStock.Mappings;

namespace PharmaStock.Services;

public class InventoryStockService : InventoryStockServiceInterface
{
    private readonly PharmaStockDbContext _context;

    public InventoryStockService(PharmaStockDbContext context)
    {
        _context = context;
    }

    public async Task<List<InventoryStockListItemResponse>> GetInventoryStocksAsync()
    {
        var stocks = await _context.InventoryStocks
            .Include(s => s.Medication)
            .AsNoTracking()
            .OrderBy(s => s.Medication.Name)
            .ThenBy(s => s.LotNumber)
            .ToListAsync();

        return stocks.Select(s => s.ToInventoryStockListItemResponse()).ToList();
    }

    // --------------------------------------------------------------------------------------
    // Adjust inventory stock quantity by a specified amount (positive or negative)
    // Throw errors if the resulting quantity would be negative or if the stock record is not found
    // Throws ArgumentNullException if the request is null
    // Uses the InventoryStockMapping to convert the updated stock entity to a response DTO
    // --------------------------------------------------------------------------------------
    public async Task<InventoryStockResponse> AdjustInventoryStockAsync(
        int inventoryStockId,
        InventoryAdjustQuantityRequest request)
   {
        if (request == null)
            throw new ArgumentNullException(nameof(request));


        var stock = await _context.InventoryStocks
            .FirstOrDefaultAsync(x => x.InventoryStockId == inventoryStockId);

        if (stock == null)
            throw new KeyNotFoundException("Inventory stock not found.");

        int newQuantity = stock.QuantityOnHand + request.Adjustment;

        if (newQuantity < 0)
            throw new InvalidOperationException(
                $"Quantity cannot go below zero. Current quantity: {stock.QuantityOnHand}");

        stock.QuantityOnHand = newQuantity;
        stock.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return stock.ToInventoryStockResponse();
    }

    // --------------------------------------------------------------------------------------
    // Get inventory stock details by ID
    // Throws KeyNotFoundException if the stock record is not found
    // Uses the InventoryStockMapping to convert the stock entity to a response DTO
    // --------------------------------------------------------------------------------------
    public async Task<InventoryStockResponse> GetInventoryStockByIdAsync(int inventoryStockId)
    {
        var stock = await _context.InventoryStocks
            .FirstOrDefaultAsync(x => x.InventoryStockId == inventoryStockId);

        if (stock == null)
            throw new KeyNotFoundException("Inventory stock not found.");

        return stock.ToInventoryStockResponse();    
    }

    // --------------------------------------------------------------------------------------
    // Create a new inventory stock record for a medication
    // Throws KeyNotFoundException if the medication is not found
    // Throws InvalidOperationException if a stock record already exists for the medication
    // Uses the InventoryStockMapping to convert the new stock entity to a response DTO
    // --------------------------------------------------------------------------------------
    public async Task<InventoryStockResponse> CreateInventoryStockAsync( CreateInventoryStockDto request)

    {
        var medication = await _context.Medications
            .FirstOrDefaultAsync(m => m.MedicationId == request.MedicationId);

        if (medication == null)
            throw new KeyNotFoundException("Medication not found.");

        var duplicateLot = await _context.InventoryStocks.AnyAsync(s =>
        s.MedicationId == request.MedicationId &&
        s.LotNumber == request.LotNumber);

        if (duplicateLot)
            throw new InvalidOperationException(
                $"Inventory lot '{request.LotNumber}' already exists for this medication.");

        var newStock = new Data.Entities.InventoryStock
        {
            MedicationId = request.MedicationId,
            QuantityOnHand = request.QuantityOnHand,
            ReorderLevel = request.ReorderLevel,
            BinLocation = request.BinLocation,
            LotNumber = request.LotNumber,
            ExpirationDate = request.ExpirationDate,
            BeyondUseDate = request.BeyondUseDate,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.InventoryStocks.Add(newStock);
        await _context.SaveChangesAsync();

        return newStock.ToInventoryStockResponse();
    }

}
