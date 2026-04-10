

namespace PharmaStock.Dtos.Requests.Medication
{
    public class ExpiredMedicationReportRequestDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}