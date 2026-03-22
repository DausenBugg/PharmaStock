


namespace PharmaStock.Dtos.Requests.Inventory
{
    public class InventoryAdjustQuantityRequest
    {
        public int Adjustment { get; set; }
    }   
    
    public class UpdatePatchExpirationDateRequest
    {
        public DateTime? ExpirationDate { get; set; }
    }
     public class UpdatePatchBUDRequest
    {
        public DateTime? BeyondUseDate { get; set; }
    }

    public class UpdatePackageNdcRequest
    {
        public string? PackageNdc { get; set; }
    }   

    public class UpdatePackageDescriptionRequest
    {
        public string? PackageDescription { get; set; }
    }

    public class UpdateMedicationNameOverrideRequest
    {
        public string? MedicationNameOverride { get; set; }
    }

    // adding override fields for editing at the row level in the UI for Medication
    public class UpdateMedicationNameRequest
    {
        public string? MedicationName { get; set; }
    }
    public class UpdateGenericNameOverrideRequest
    {
        public string? GenericNameOverride { get; set; }
    }

    public class UpdateNationalDrugCodeOverrideRequest
    {
        public string? NationalDrugCodeOverride { get; set; }
    }   

    public class UpdateStrengthOverrideRequest
    {
        public string? StrengthOverride { get; set; }
    }

    public class UpdateDosageFormOverrideRequest
    {
        public string? DosageFormOverride { get; set; }
    }

}