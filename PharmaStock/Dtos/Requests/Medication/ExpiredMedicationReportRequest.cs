

namespace PharmaStock.Dtos.Requests.Medication
{
    public class ExpiredMedicationReportRequestDto
    {

        public bool Expired { get; set; }
        public bool ExpiringSoon { get; set; }
        public bool StockedOut { get; set; }
        public bool LowInventory { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}