public class PaginationRequestDto
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }

    public string? Search { get; set; }
    public bool? Expired { get; set; }
    public bool? ExpiringSoon { get; set; }
    public bool? StockedOut { get; set; }
    public bool? LowInventory { get; set; }

    public string? Name { get; set; }
    public string? Lot { get; set; }
}