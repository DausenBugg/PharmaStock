using System.Text;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Dtos.Requests.Medication;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services.ReportService
{
    public class ReportService : IReportService
    {
        private readonly PharmaStockDbContext _context;

        public ReportService(PharmaStockDbContext context)
        {
            _context = context;
        }

        public async Task<List<ExpiredMedicationReportResponseDto>> GetExpiredMedicationsReportAsync(
            ExpiredMedicationReportRequestDto request)
        {
            if (request.StartDate.HasValue && request.EndDate.HasValue &&
                request.StartDate.Value.Date > request.EndDate.Value.Date)
            {
                throw new ArgumentException("Start date cannot be later than end date.");
            }

            var today = DateTime.UtcNow.Date;

            var query = _context.InventoryStocks
                .Include(i => i.Medication)
                .Where(i => i.ExpirationDate.Date < today)
                .AsQueryable();

            if (request.StartDate.HasValue)
            {
                var startDate = request.StartDate.Value.Date;
                query = query.Where(i => i.ExpirationDate.Date >= startDate);
            }

            if (request.EndDate.HasValue)
            {
                var endDate = request.EndDate.Value.Date;
                query = query.Where(i => i.ExpirationDate.Date <= endDate);
            }

            return await query
                .OrderBy(i => i.ExpirationDate)
                .Select(i => new ExpiredMedicationReportResponseDto
                {
                    InventoryStockId = i.InventoryStockId,
                    MedicationId = i.MedicationId,
                    MedicationName = i.Medication.Name,
                    GenericName = i.Medication.GenericName,
                    NationalDrugCode = i.Medication.NationalDrugCode,
                    PackageNdc = i.PackageNdc,
                    PackageDescription = i.PackageDescription,
                    LotNumber = i.LotNumber,
                    QuantityOnHand = i.QuantityOnHand,
                    ExpirationDate = i.ExpirationDate,
                    BinLocation = i.BinLocation
                })
                .ToListAsync();
        }

        public async Task<byte[]> ExportExpiredMedicationsToCsvAsync(ExpiredMedicationReportRequestDto request)
        {
            var rows = await GetExpiredMedicationsReportAsync(request);

            var sb = new StringBuilder();
            sb.AppendLine("InventoryStockId,MedicationId,MedicationName,GenericName,NationalDrugCode,PackageNdc,PackageDescription,LotNumber,QuantityOnHand,ExpirationDate,BinLocation");

            foreach (var row in rows)
            {
                sb.AppendLine(string.Join(",",
                    Escape(row.InventoryStockId.ToString()),
                    Escape(row.MedicationId.ToString()),
                    Escape(row.MedicationName),
                    Escape(row.GenericName),
                    Escape(row.NationalDrugCode),
                    Escape(row.PackageNdc),
                    Escape(row.PackageDescription),
                    Escape(row.LotNumber),
                    Escape(row.QuantityOnHand.ToString()),
                    Escape(row.ExpirationDate.ToString("yyyy-MM-dd")),
                    Escape(row.BinLocation)
                ));
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static string Escape(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return "";

            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }

            return value;
        }
    }
}