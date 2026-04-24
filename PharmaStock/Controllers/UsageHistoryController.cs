using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Dtos.Responses;

namespace PharmaStock.Controllers;

[ApiController]
[Route("api/usagehistory")]
public class UsageHistoryController : ControllerBase
{
    private readonly PharmaStockDbContext _context;

    public UsageHistoryController(PharmaStockDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns the most recent usage history entries, newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> GetRecent([FromQuery] int take = 10)
    {
        if (take < 1 || take > 100)
            return BadRequest(new { message = "take must be between 1 and 100." });

        var entries = await _context.UsageHistories
            .AsNoTracking()
            .Include(u => u.InventoryStock)
            .Include(u => u.Medication)
            .OrderByDescending(u => u.OccurredAtUtc)
            .Take(take)
            .Select(u => new UsageHistoryResponse
            {
                UsageHistoryId   = u.UsageHistoryId,
                MedicationName   = u.InventoryStock.MedicationNameOverride
                                   ?? u.Medication.Name,
                LotNumber        = u.InventoryStock.LotNumber,
                QuantityChanged  = u.QuantityChanged,
                ChangeType       = u.ChangeType,
                OccurredAtUtc    = u.OccurredAtUtc
            })
            .ToListAsync();

        return Ok(entries);
    }
}
