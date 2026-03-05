// PharmaStock.Importer/Program.cs

using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Importer.Cleaning;
using PharmaStock.Importer.Raw;
using System.Globalization;

Console.WriteLine("Importer starting...");

// --------------------
// Load API config + create DbContext
// --------------------
var importerProjectPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..")); // ...\PharmaStock.Importer
var apiProjectPath = Path.GetFullPath(Path.Combine(importerProjectPath, "..", "PharmaStock"));        // ...\PharmaStock (API project)

var config = new ConfigurationBuilder()
    .SetBasePath(apiProjectPath)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var conn = config.GetConnectionString("PharmaStockDb");
if (string.IsNullOrWhiteSpace(conn))
{
    Console.WriteLine("❌ No connection string found at ConnectionStrings:PharmaStockDb in API appsettings.");
    return;
}

var options = new DbContextOptionsBuilder<PharmaStockDbContext>()
    .UseMySql(conn, ServerVersion.AutoDetect(conn))
    .Options;

using var db = new PharmaStockDbContext(options);

if (!await db.Database.CanConnectAsync())
{
    Console.WriteLine("❌ DB connection failed.");
    return;
}

Console.WriteLine("✅ DB connection OK");

// --------------------
// Find repo root + CSV paths
// --------------------
var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..")); // ...\PharmaStock
var dataDir = Path.Combine(repoRoot, "data");
var fullDir = Path.Combine(dataDir, "Full");

var productCsv = Path.Combine(fullDir, "NdcProductDataSet.csv");
var packageCsv = Path.Combine(fullDir, "NdcPackageDataSet.csv");

Console.WriteLine($"Repo root:    {repoRoot}");
Console.WriteLine($"Data dir:     {dataDir}");
Console.WriteLine($"Product file: {productCsv}");
Console.WriteLine($"Package file: {packageCsv}");

if (!File.Exists(productCsv))
{
    Console.WriteLine($"❌ Missing product file: {productCsv}");
    return;
}
if (!File.Exists(packageCsv))
{
    Console.WriteLine($"❌ Missing package file: {packageCsv}");
    return;
}

// --------------------
// CSV config (auto-detect delimiter)
// --------------------
string DetectDelimiter(string path)
{
    using var r = new StreamReader(path);
    var header = r.ReadLine() ?? "";
    var commas = header.Count(c => c == ',');
    var tabs = header.Count(c => c == '\t');
    return tabs > commas ? "\t" : ",";
}

CsvConfiguration MakeCfg(string delim) => new(CultureInfo.InvariantCulture)
{
    Delimiter = delim,
    BadDataFound = null,
    MissingFieldFound = null,
    HeaderValidated = null,
    DetectColumnCountChanges = false,
    TrimOptions = TrimOptions.Trim
};

var productDelim = DetectDelimiter(productCsv);
var packageDelim = DetectDelimiter(packageCsv);

Console.WriteLine($"Detected product delimiter: {(productDelim == "\t" ? "TAB" : "COMMA")}");
Console.WriteLine($"Detected package delimiter: {(packageDelim == "\t" ? "TAB" : "COMMA")}");

// --------------------
// Helper methods for streaming CSV reading, batching, and cleaning
// --------------------
static IEnumerable<T> ReadStream<T>(string path, CsvConfiguration cfg)
{
    using var reader = new StreamReader(path);
    using var csv = new CsvReader(reader, cfg);

    foreach (var record in csv.GetRecords<T>())
        yield return record;
}

static IEnumerable<List<T>> Batch<T>(IEnumerable<T> source, int size)
{
    var batch = new List<T>(size);
    foreach (var item in source)
    {
        batch.Add(item);
        if (batch.Count >= size)
        {
            yield return batch;
            batch = new List<T>(size);
        }
    }
    if (batch.Count > 0) yield return batch;
}

static string Clean(string? s) => (s ?? "").Trim();

static string BuildStrength(string? num, string? unit)
{
    var n = Clean(num);
    var u = Clean(unit);
    if (string.IsNullOrWhiteSpace(n) && string.IsNullOrWhiteSpace(u)) return "";
    if (string.IsNullOrWhiteSpace(u)) return n;
    if (string.IsNullOrWhiteSpace(n)) return u;
    return $"{n} {u}";
}

static string Trunc(string s, int max)
{
    s = (s ?? "").Trim();
    if (s.Length <= max) return s;
    return s.Substring(0, max);
}

// --------------------
// Import products -> Medication
// --------------------
Console.WriteLine("---- IMPORT PRODUCTS -> Medication ----");


var now = DateTime.UtcNow;
const int productBatchSize = 1000;

db.ChangeTracker.AutoDetectChangesEnabled = false;

int pProcessed = 0, pInserted = 0, pUpdated = 0, pSkippedNoNdc = 0;

var productStream = ReadStream<ProductRow>(productCsv, MakeCfg(productDelim));

// Preview first 5 records to verify CSV reading and cleaning
var first = productStream.Take(5).ToList();
foreach (var r in first)
{
    Console.WriteLine($"Brand={r.PROPRIETARYNAME} Generic={r.NONPROPRIETARYNAME}");
}


foreach (var batch in Batch(productStream, productBatchSize))
{
    pProcessed += batch.Count;

    var clean = batch
        .Select(r => new { Row = r, Ndc = NdcNormalizer.DigitsOnly(r.PRODUCTNDC) })
        .Where(x => !string.IsNullOrWhiteSpace(x.Ndc))
        .ToList();

    pSkippedNoNdc += (batch.Count - clean.Count);
    if (clean.Count == 0) continue;

    var ndcs = clean.Select(x => x.Ndc!).Distinct().ToList();

    var existing = await db.Set<Medication>()
        .Where(m => ndcs.Contains(m.NationalDrugCode))
        .ToDictionaryAsync(m => m.NationalDrugCode);

    foreach (var x in clean)
    {
        var r = x.Row;
        var ndc = x.Ndc!;

        var name = Clean(r.PROPRIETARYNAME);
        if (string.IsNullOrWhiteSpace(name)) name = Clean(r.NONPROPRIETARYNAME);
        if (string.IsNullOrWhiteSpace(name)) name = ndc;

        var form = Clean(r.DOSAGEFORMNAME);
        var strength = BuildStrength(r.ACTIVE_NUMERATOR_STRENGTH, r.ACTIVE_INGRED_UNIT);
        var manufacturer = Clean(r.LABELERNAME);
        var genericName = Clean(r.NONPROPRIETARYNAME);

        // Truncate fields to fit database constraints
        name = Trunc(name, 200);
        genericName = Trunc(genericName, 200);
        form = Trunc(form, 100);
        manufacturer = Trunc(manufacturer, 255);
        strength = Trunc(strength, 100);

        if (!existing.TryGetValue(ndc, out var med))
        {
            med = new Medication
            {
                NationalDrugCode = ndc,
                Name = name,
                GenericName = genericName,
                Form = form,
                Strength = strength,
                Manufacturer = manufacturer,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            db.Add(med);
            existing[ndc] = med;
            pInserted++;
        }
        else
        {
            med.Name = name;
            med.GenericName = genericName;
            med.Form = form;
            med.Strength = strength;
            med.Manufacturer = manufacturer;
            med.UpdatedAtUtc = now;
            pUpdated++;
        }
    }

    db.ChangeTracker.DetectChanges();
    await db.SaveChangesAsync();
    db.ChangeTracker.Clear();

    Console.WriteLine($"Products batch: processed={pProcessed:N0} inserted={pInserted:N0} updated={pUpdated:N0} skippedNoNdc={pSkippedNoNdc:N0}");
}

Console.WriteLine($"✅ Products done. processed={pProcessed:N0} inserted={pInserted:N0} updated={pUpdated:N0} skippedNoNdc={pSkippedNoNdc:N0}");

// --------------------
// Import packages -> InventoryStock
// --------------------
Console.WriteLine("---- IMPORT PACKAGES -> InventoryStock ----");

var pkgNow = DateTime.UtcNow;
const int packageBatchSize = 1000;

db.ChangeTracker.AutoDetectChangesEnabled = false;

int kProcessed = 0, kInserted = 0, kUpdated = 0, kSkippedNoKeys = 0, kSkippedNoMed = 0;

var packageStream = ReadStream<PackageRow>(packageCsv, MakeCfg(packageDelim));

foreach (var batch in Batch(packageStream, packageBatchSize))
{
    kProcessed += batch.Count;

    var clean = batch
        .Select(r => new
        {
            Row = r,
            ProductNdc = NdcNormalizer.DigitsOnly(r.PRODUCTNDC),
            PackageNdc = NdcNormalizer.DigitsOnly(r.NDCPACKAGECODE)
        })
        .Where(x => !string.IsNullOrWhiteSpace(x.ProductNdc) && !string.IsNullOrWhiteSpace(x.PackageNdc))
        .ToList();

    kSkippedNoKeys += (batch.Count - clean.Count);
    if (clean.Count == 0) continue;

    var productNdcs = clean.Select(x => x.ProductNdc!).Distinct().ToList();

    // Load meds needed for this batch
    var meds = await db.Set<Medication>()
        .Where(m => productNdcs.Contains(m.NationalDrugCode))
        .Select(m => new { m.MedicationId, m.NationalDrugCode })
        .ToListAsync();

    var medByNdc = meds.ToDictionary(x => x.NationalDrugCode, x => x.MedicationId);

    // Load existing stocks for those meds to support upsert by MedicationId+PackageNdc
    var medIds = meds.Select(x => x.MedicationId).Distinct().ToList();

    var existingStocks = await db.Set<InventoryStock>()
        .Where(s => medIds.Contains(s.MedicationId))
        .ToListAsync();

    var stockByKey = existingStocks.ToDictionary(
        s => $"{s.MedicationId}|{s.PackageNdc}",
        s => s
    );

    foreach (var x in clean)
    {
        var r = x.Row;
        var productNdc = x.ProductNdc!;
        var packageNdc = x.PackageNdc!;

        if (!medByNdc.TryGetValue(productNdc, out var medId))
        {
            kSkippedNoMed++;
            continue;
        }

        var key = $"{medId}|{packageNdc}";
        var desc = string.IsNullOrWhiteSpace(r.PACKAGEDESCRIPTION) ? null : r.PACKAGEDESCRIPTION.Trim();

        if (!stockByKey.TryGetValue(key, out var stock))
        {
            stock = new InventoryStock
            {
                MedicationId = medId,
                PackageNdc = packageNdc,
                PackageDescription = desc,

                QuantityOnHand = 0,
                ReorderLevel = 0,
                BinLocation = "",
                LotNumber = "",

                // required DateTime fields in your model
                ExpirationDate = pkgNow,
                BeyondUseDate = pkgNow,

                UpdatedAtUtc = pkgNow
            };

            db.Add(stock);
            stockByKey[key] = stock;
            kInserted++;
        }
        else
        {
            stock.PackageDescription = desc;
            stock.UpdatedAtUtc = pkgNow;
            kUpdated++;
        }
    }

    db.ChangeTracker.DetectChanges();
    await db.SaveChangesAsync();
    db.ChangeTracker.Clear();

    Console.WriteLine($"Packages batch: processed={kProcessed:N0} inserted={kInserted:N0} updated={kUpdated:N0} skippedNoKeys={kSkippedNoKeys:N0} skippedNoMed={kSkippedNoMed:N0}");
}

Console.WriteLine($"✅ Packages done. processed={kProcessed:N0} inserted={kInserted:N0} updated={kUpdated:N0} skippedNoKeys={kSkippedNoKeys:N0} skippedNoMed={kSkippedNoMed:N0}");

Console.WriteLine("✅ Import complete.");