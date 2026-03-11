using PharmaStock.Dtos.Responses;

namespace PharmaStock.Services;

public interface IAIPredictionService
{
    Task<List<ReorderPredictionResponse>> GetReorderAlertsAsync();
    Task<List<ExpirationRiskResponse>> GetExpirationRisksAsync();
}
