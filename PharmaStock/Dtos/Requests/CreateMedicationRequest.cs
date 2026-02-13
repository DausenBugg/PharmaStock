using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Dtos.Requests
{
    public class CreateMedicationDto
    {
        [Required, StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 1)]
        public string NationalDrugCode { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 1)]
        public string Form { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 1)]
        public string Strength { get; set; } = string.Empty;

        [Required, StringLength(100, MinimumLength = 1)]
        public string Manufacturer { get; set; } = string.Empty;
    }
}
