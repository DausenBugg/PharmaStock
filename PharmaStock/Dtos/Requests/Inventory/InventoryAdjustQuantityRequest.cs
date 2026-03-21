


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

}