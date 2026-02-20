using System.ComponentModel.DataAnnotations;

namespace PharmaStock.Dtos.Requests
{
    public class UpdatePatchMedicationDto
    {
        // These fields are all required for a PUT update, but optional for a PATCH update. Validation will be handled in the controller.

        public string? Name { get; set; }
        public string? NationalDrugCode { get; set; }
        public string? Form { get; set; }
        public string? Strength { get; set; }
        public string? Manufacturer { get; set; }
    }
}