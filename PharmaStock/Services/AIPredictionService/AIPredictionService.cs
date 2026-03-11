using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services;

public class AIPredictionService : IAIPredictionService
{
    private readonly HttpClient _httpClient;
    private readonly PharmaStockDbContext _context;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public AIPredictionService(HttpClient httpClient, PharmaStockDbContext context)
    {
        _httpClient = httpClient;
        _context = context;
    }

    public async Task<List<ReorderPredictionResponse>> GetReorderAlertsAsync()
    {
        // Get all medications with their inventory and recent usage history
        var medications = await _context.Medications
            .Include(m => m.InventoryStocks)
            .AsNoTracking()
            .ToListAsync();

        var now = DateTime.UtcNow;
        var ninetyDaysAgo = now.AddDays(-90);

        // Get usage history for the last 90 days
        var usageHistory = await _context.UsageHistories
            .Where(u => u.OccurredAtUtc >= ninetyDaysAgo)
            .AsNoTracking()
            .ToListAsync();

        var batchRequest = new
        {
            medications = medications.Select(med =>
            {
                var medUsage = usageHistory
                    .Where(u => u.MedicationId == med.MedicationId)
                    .Select(u => new
                    {
                        quantity_changed = u.QuantityChanged,
                        change_type = u.ChangeType,
                        occurred_at_utc = u.OccurredAtUtc.ToString("o")
                    })
                    .ToList();

                var activeLots = med.InventoryStocks
                    .Where(s => s.ExpirationDate > now)
                    .ToList();

                return new
                {
                    medication_id = med.MedicationId,
                    medication_form = med.Form,
                    usage_history = medUsage,
                    current_stock = activeLots.Sum(s => s.QuantityOnHand),
                    num_active_lots = activeLots.Count,
                    days_to_nearest_expiry = activeLots.Any()
                        ? activeLots.Min(s => (s.ExpirationDate - now).Days)
                        : 0
                };
            }).ToList()
        };

        var response = await _httpClient.PostAsJsonAsync("/predict/batch-reorder", batchRequest, JsonOptions);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<BatchReorderResult>(JsonOptions);

        // Filter to only medications where current stock is at or below the recommended level
        var alerts = new List<ReorderPredictionResponse>();
        foreach (var pred in result?.Predictions ?? [])
        {
            var med = medications.FirstOrDefault(m => m.MedicationId == pred.MedicationId);
            if (med == null) continue;

            var totalStock = med.InventoryStocks
                .Where(s => s.ExpirationDate > now)
                .Sum(s => s.QuantityOnHand);

            if (totalStock <= pred.RecommendedReorderLevel)
            {
                alerts.Add(pred);
            }
        }

        return alerts.OrderBy(a => a.Confidence).ToList();
    }

    public async Task<List<ExpirationRiskResponse>> GetExpirationRisksAsync()
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        // Get all active inventory lots
        var stocks = await _context.InventoryStocks
            .Include(s => s.Medication)
            .AsNoTracking()
            .ToListAsync();

        // Get daily usage averages per medication
        var usageByMed = await _context.UsageHistories
            .Where(u => u.OccurredAtUtc >= thirtyDaysAgo && u.ChangeType == "Dispensed")
            .GroupBy(u => u.MedicationId)
            .Select(g => new { MedicationId = g.Key, TotalUsed = g.Sum(u => u.QuantityChanged) })
            .AsNoTracking()
            .ToListAsync();

        var avgUsageLookup = usageByMed.ToDictionary(
            u => u.MedicationId,
            u => u.TotalUsed / 30.0
        );

        var batchRequest = new
        {
            inventory_items = stocks.Select(s => new
            {
                inventory_stock_id = s.InventoryStockId,
                medication_id = s.MedicationId,
                quantity_on_hand = s.QuantityOnHand,
                expiration_date = s.ExpirationDate.ToString("o"),
                avg_daily_usage_30d = avgUsageLookup.GetValueOrDefault(s.MedicationId, 0.0),
                medication_unit_value = 1.0,
                // FastAPI schema requires num_lots_same_med >= 1
                num_lots_same_med = Math.Max(1, stocks.Count(x => x.MedicationId == s.MedicationId && x.ExpirationDate > now))
            }).ToList()
        };

        var response = await _httpClient.PostAsJsonAsync("/predict/batch-expiration", batchRequest, JsonOptions);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<BatchExpirationResult>(JsonOptions);

        return (result?.RiskScores ?? [])
            .OrderByDescending(r => r.RiskScore)
            .ToList();
    }

    // Internal DTOs for deserializing Python API responses
    private record BatchReorderResult(List<ReorderPredictionResponse> Predictions);
    private record BatchExpirationResult(List<ExpirationRiskResponse> RiskScores);
}
