using System.Security.Cryptography.X509Certificates;
using PharmaStock.Dtos.Responses;

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
     public int PageNumber { get; set; }
    public int PageSize { get; set; }
     public int TotalItemCount { get; set; }
     public int TotalPages  { get; set; }

     public InventorySummaryDto Summary {get; set; } = new();

}