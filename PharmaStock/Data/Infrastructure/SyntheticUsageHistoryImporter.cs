using Microsoft.EntityFrameworkCore;
using PharmaStock.Data.Entities;

namespace PharmaStock.Data.Infrastucture;

public sealed class SyntheticUsageHistoryImporter
{
    private static readonly HashSet<string> ValidChangeTypes =
    [
        "Dispensed",
        "Restocked",
        "Adjustment",
        "Expired_Disposal"
    ];

    // These IDs come from ai-service/data/generate_synthetic_data.py and are stable for generated CSVs.
    private static readonly IReadOnlyDictionary<int, string> SyntheticMedicationNdcById = new Dictionary<int, string>
    {
        [1] = "NDC-00000-0001",
        [2] = "NDC-00000-0002",
        [3] = "NDC-00000-0003",
        [4] = "NDC-00000-0004",
        [5] = "NDC-00000-0005",
        [6] = "NDC-00000-0006",
        [7] = "NDC-00000-0007",
        [8] = "NDC-00000-0008",
        [9] = "NDC-00000-0009",
        [10] = "NDC-EDGE-9999999999999999999999999999999999999999"
    };

    private static readonly IReadOnlyDictionary<int, string> SyntheticLotByInventoryId = new Dictionary<int, string>
    {
        [1] = "LOT-IBU-A1",
        [2] = "LOT-IBU-B1",
        [3] = "LOT-ACE-ZERO",
        [4] = "LOT-AMOX-000",
        [5] = "LOT-OME-LOW",
        [6] = "LOT-LIS-EXP",
        [7] = "LOT-CET-TODAY",
        [8] = "LOT-EDGE-FUTURE",
        [9] = "LOT-LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
        [10] = "LOT-ALB-001",
        [11] = "LOT-ATOR-040"
    };

    private readonly PharmaStockDbContext _dbContext;
    private readonly ILogger<SyntheticUsageHistoryImporter> _logger;
    private readonly IWebHostEnvironment _environment;

    public SyntheticUsageHistoryImporter(
        PharmaStockDbContext dbContext,
        ILogger<SyntheticUsageHistoryImporter> logger,
        IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _logger = logger;
        _environment = environment;
    }

    public async Task<int> ImportAsync(string? csvPath = null, bool replaceExisting = false, CancellationToken cancellationToken = default)
    {
        var resolvedCsvPath = ResolveCsvPath(csvPath);
        if (!File.Exists(resolvedCsvPath))
        {
            throw new FileNotFoundException($"Synthetic usage history CSV was not found at '{resolvedCsvPath}'.", resolvedCsvPath);
        }

        await _dbContext.Database.MigrateAsync(cancellationToken);

        var rows = await ParseRowsAsync(resolvedCsvPath, cancellationToken);
        if (rows.Count == 0)
        {
            _logger.LogWarning("No rows were found in {CsvPath}. Nothing was imported.", resolvedCsvPath);
            return 0;
        }

        var mappedRows = await RemapSyntheticIdsToCurrentDatabaseAsync(rows, cancellationToken);

        var inventoryIds = (await _dbContext.InventoryStocks
            .AsNoTracking()
            .Select(stock => stock.InventoryStockId)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        var medicationIds = (await _dbContext.Medications
            .AsNoTracking()
            .Select(medication => medication.MedicationId)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        ValidateForeignKeys(mappedRows, inventoryIds, medicationIds);

        if (replaceExisting)
        {
            var deleted = await _dbContext.Database.ExecuteSqlRawAsync("DELETE FROM UsageHistories", cancellationToken);
            _logger.LogInformation("Deleted {DeletedCount} existing UsageHistories rows before import.", deleted);
        }

        const int batchSize = 1000;
        var imported = 0;

        foreach (var batch in mappedRows.Chunk(batchSize))
        {
            var entities = batch.Select(row => new UsageHistory
            {
                InventoryStockId = row.InventoryStockId,
                MedicationId = row.MedicationId,
                QuantityChanged = row.QuantityChanged,
                ChangeType = row.ChangeType,
                OccurredAtUtc = row.OccurredAtUtc,
                CreatedAtUtc = row.OccurredAtUtc
            });

            await _dbContext.UsageHistories.AddRangeAsync(entities, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _dbContext.ChangeTracker.Clear();

            imported += batch.Length;
            _logger.LogInformation("Imported {Imported}/{Total} UsageHistories rows.", imported, mappedRows.Count);
        }

        return imported;
    }

    private async Task<List<SyntheticUsageRow>> RemapSyntheticIdsToCurrentDatabaseAsync(
        List<SyntheticUsageRow> rows,
        CancellationToken cancellationToken)
    {
        var stockNeedsRemap = rows.Any(row => SyntheticLotByInventoryId.ContainsKey(row.InventoryStockId));
        var medNeedsRemap = rows.Any(row => SyntheticMedicationNdcById.ContainsKey(row.MedicationId));

        if (!stockNeedsRemap && !medNeedsRemap)
        {
            return rows;
        }

        var lotToInventoryId = await _dbContext.InventoryStocks
            .AsNoTracking()
            .ToDictionaryAsync(stock => stock.LotNumber, stock => stock.InventoryStockId, cancellationToken);

        var ndcToMedicationId = await _dbContext.Medications
            .AsNoTracking()
            .ToDictionaryAsync(medication => medication.NationalDrugCode, medication => medication.MedicationId, cancellationToken);

        var remapped = new List<SyntheticUsageRow>(rows.Count);
        foreach (var row in rows)
        {
            var inventoryStockId = row.InventoryStockId;
            if (SyntheticLotByInventoryId.TryGetValue(row.InventoryStockId, out var lotNumber)
                && lotToInventoryId.TryGetValue(lotNumber, out var mappedInventoryId))
            {
                inventoryStockId = mappedInventoryId;
            }

            var medicationId = row.MedicationId;
            if (SyntheticMedicationNdcById.TryGetValue(row.MedicationId, out var ndc)
                && ndcToMedicationId.TryGetValue(ndc, out var mappedMedicationId))
            {
                medicationId = mappedMedicationId;
            }

            remapped.Add(new SyntheticUsageRow(
                inventoryStockId,
                medicationId,
                row.QuantityChanged,
                row.ChangeType,
                row.OccurredAtUtc));
        }

        return remapped;
    }

    private string ResolveCsvPath(string? csvPath)
    {
        if (!string.IsNullOrWhiteSpace(csvPath))
        {
            return Path.GetFullPath(csvPath, _environment.ContentRootPath);
        }

        return Path.GetFullPath(
            Path.Combine(_environment.ContentRootPath, "..", "ai-service", "data", "synthetic_usage_history.csv"));
    }

    private static async Task<List<SyntheticUsageRow>> ParseRowsAsync(string csvPath, CancellationToken cancellationToken)
    {
        var rows = new List<SyntheticUsageRow>();

        await using var stream = File.OpenRead(csvPath);
        using var reader = new StreamReader(stream);

        var headerLine = await reader.ReadLineAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            throw new InvalidOperationException("Synthetic usage history CSV is empty.");
        }

        var headers = headerLine.Split(',', StringSplitOptions.TrimEntries);
        var indexMap = headers
            .Select((name, index) => new { name, index })
            .ToDictionary(item => item.name, item => item.index, StringComparer.OrdinalIgnoreCase);

        var requiredHeaders = new[]
        {
            "inventory_stock_id",
            "medication_id",
            "quantity_changed",
            "change_type",
            "occurred_at_utc"
        };

        var missingHeaders = requiredHeaders.Where(header => !indexMap.ContainsKey(header)).ToArray();
        if (missingHeaders.Length > 0)
        {
            throw new InvalidOperationException($"Synthetic usage history CSV is missing required columns: {string.Join(", ", missingHeaders)}.");
        }

        var lineNumber = 1;
        while (!reader.EndOfStream)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(cancellationToken);
            lineNumber++;

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var columns = line.Split(',', StringSplitOptions.None | StringSplitOptions.TrimEntries);
            if (columns.Length < headers.Length)
            {
                throw new InvalidOperationException($"CSV row {lineNumber} has {columns.Length} columns but {headers.Length} were expected.");
            }

            var changeType = columns[indexMap["change_type"]];
            if (!ValidChangeTypes.Contains(changeType))
            {
                throw new InvalidOperationException($"CSV row {lineNumber} contains an invalid change type '{changeType}'.");
            }

            if (!int.TryParse(columns[indexMap["inventory_stock_id"]], out var inventoryStockId))
            {
                throw new InvalidOperationException($"CSV row {lineNumber} has an invalid inventory_stock_id.");
            }

            if (!int.TryParse(columns[indexMap["medication_id"]], out var medicationId))
            {
                throw new InvalidOperationException($"CSV row {lineNumber} has an invalid medication_id.");
            }

            if (!int.TryParse(columns[indexMap["quantity_changed"]], out var quantityChanged))
            {
                throw new InvalidOperationException($"CSV row {lineNumber} has an invalid quantity_changed.");
            }

            if (!DateTime.TryParse(columns[indexMap["occurred_at_utc"]], out var occurredAtUtc))
            {
                throw new InvalidOperationException($"CSV row {lineNumber} has an invalid occurred_at_utc timestamp.");
            }

            rows.Add(new SyntheticUsageRow(
                inventoryStockId,
                medicationId,
                quantityChanged,
                changeType,
                DateTime.SpecifyKind(occurredAtUtc, DateTimeKind.Utc)));
        }

        return rows;
    }

    private static void ValidateForeignKeys(
        IReadOnlyCollection<SyntheticUsageRow> rows,
        IReadOnlySet<int> inventoryIds,
        IReadOnlySet<int> medicationIds)
    {
        var missingInventoryIds = rows
            .Select(row => row.InventoryStockId)
            .Where(id => !inventoryIds.Contains(id))
            .Distinct()
            .Order()
            .ToArray();

        if (missingInventoryIds.Length > 0)
        {
            throw new InvalidOperationException(
                $"The CSV references InventoryStockId values not found in the database: {string.Join(", ", missingInventoryIds)}.");
        }

        var missingMedicationIds = rows
            .Select(row => row.MedicationId)
            .Where(id => !medicationIds.Contains(id))
            .Distinct()
            .Order()
            .ToArray();

        if (missingMedicationIds.Length > 0)
        {
            throw new InvalidOperationException(
                $"The CSV references MedicationId values not found in the database: {string.Join(", ", missingMedicationIds)}.");
        }
    }

    private sealed record SyntheticUsageRow(
        int InventoryStockId,
        int MedicationId,
        int QuantityChanged,
        string ChangeType,
        DateTime OccurredAtUtc);
}