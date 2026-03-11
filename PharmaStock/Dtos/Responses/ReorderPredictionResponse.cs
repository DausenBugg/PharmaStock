namespace PharmaStock.Dtos.Responses;

public class ReorderPredictionResponse
{
    public int MedicationId { get; set; }
    public int RecommendedReorderLevel { get; set; }
    public double Confidence { get; set; }
    public bool IsPopular { get; set; }
}
