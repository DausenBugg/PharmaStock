public class PaginationRequestDto
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }

    // 🔥 ADD THESE
    public string? Search { get; set; }
    public bool? Expired { get; set; }
    public bool? ExpiringSoon { get; set; }
    public bool? StockedOut { get; set; }
    public bool? LowInventory { get; set; }
}