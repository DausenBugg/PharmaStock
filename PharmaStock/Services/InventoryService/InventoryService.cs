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

    public async Task<IEnumerable<InventoryStockResponse>> GetInventoryStocksAsync()
    {
        var stocks = await _context.InventoryStocks
            .Include(s => s.Medication) // Include related medication data for mapping to response DTO
            .AsNoTracking()
            .OrderBy(s => s.InventoryStockId)
            .ToListAsync();
        return stocks.Select(s => s.ToInventoryStockResponse()).ToList();
    }

    // --------------------------------------------------------------------------------------
    // Get all inventory stock records with quantity on hand greater than zero
     // Orders results by medication name and lot number for easier readability
     // Uses AsNoTracking for better performance since we are only reading data
    // Uses the InventoryStockMapping to convert stock entities to response DTOs    
    // --------------------------------------------------------------------------------------
    public async Task<List<InventoryStockListItemResponse>> GetInStockListAsync()
    {
        var stocks = await _context.InventoryStocks
            .Take(100) // Limit to 100 records for performance; can be adjusted as needed
            .Include(s => s.Medication) // Include related medication data for mapping to response DTO
            .AsNoTracking()
            .OrderBy(s => s.InventoryStockId)
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

        // Log usage history for AI model training
        var changeType = request.Adjustment < 0 ? "Dispensed" : "Restocked";
        _context.UsageHistories.Add(new Data.Entities.UsageHistory
        {
            InventoryStockId = stock.InventoryStockId,
            MedicationId = stock.MedicationId,
            QuantityChanged = Math.Abs(request.Adjustment),
            ChangeType = changeType,
            OccurredAtUtc = DateTime.UtcNow
        });


        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Handle potential database update exceptions, such as concurrency issues
            throw new InvalidOperationException("Save Failed: Failed to Save Usage History to Table", ex);
        }
    

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

        // Guards againts for empty PackageNdc which is required for data integrity in the inventory stock record
        if (string.IsNullOrWhiteSpace(request.PackageNdc))
            throw new InvalidOperationException("PackageNdc is required.");

        //duplicate check for the package NDC to ensure data integrity in the inventory stock records
        var duplicatePackageNdc = await _context.InventoryStocks.AnyAsync(s =>
        s.PackageNdc == request.PackageNdc);

        if (duplicatePackageNdc)
            throw new InvalidOperationException($"PackageNdc '{request.PackageNdc}' already exists.");

            
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
            UpdatedAtUtc = DateTime.UtcNow,

            //added package level inventory tracking for the new stock entity
            PackageNdc = request.PackageNdc.Trim(),
            PackageDescription = request.PackageDescription?.Trim()
        };

        _context.InventoryStocks.Add(newStock);
        await _context.SaveChangesAsync();

        return newStock.ToInventoryStockResponse();
    }

}
