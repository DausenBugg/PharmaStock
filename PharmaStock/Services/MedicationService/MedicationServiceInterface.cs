using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services
{
    public interface MedicationServiceInterface
    {
        Task<List<MedicationResponse>> GetAllMedicationsAsync(
            string? name,
            string? manufacturer,
            string? form,
            string? NationalDrugCode
        );

        Task<MedicationResponse?> GetMedicationByIdAsync(int id);

        Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs, MedicationResponse? data)>
            CreateAsync(CreateMedicationDto request);

        Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs, MedicationResponse? data)>
            UpdateAsync(int id, UpdateMedicationDto request);
        
        Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs)> 
            PatchAsync(int id, UpdatePatchMedicationDto request);
        
        Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs)> 
            DeleteAsync(int id);

    }
}