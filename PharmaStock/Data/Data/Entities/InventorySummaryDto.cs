namespace PharmaStock.Data.Data.Entities
{
    public class InventorySummaryDto
    {
        public int TotalItems { get; set; }
        public int LowStockCount { get; set; }
        public int ExpiringCount { get; set; }
        public int ExpiredCount { get; set; }
    }
}