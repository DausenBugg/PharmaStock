using PharmaStock.Dtos.Requests.Medication;
using PharmaStock.Dtos.Responses;

public interface IReportService
{
    Task<List<ExpiredMedicationReportResponseDto>> GetExpiredMedicationsReportAsync(ExpiredMedicationReportRequestDto request);
    Task<byte[]> ExportExpiredMedicationsToCsvAsync(ExpiredMedicationReportRequestDto request);
}
