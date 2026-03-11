using Microsoft.AspNetCore.Mvc;
using PharmaStock.Services;

namespace PharmaStock.Controllers;

[ApiController]
[Route("api/predictions")]
public class PredictionsController : ControllerBase
{
    private readonly IAIPredictionService _aiService;

    public PredictionsController(IAIPredictionService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>
    /// Returns medications where current stock is at or below the AI-recommended reorder level.
    /// Popular drugs get higher thresholds; slow movers get lower thresholds.
    /// </summary>
    [HttpGet("reorder-alerts")]
    public async Task<IActionResult> GetReorderAlerts()
    {
        try
        {
            var alerts = await _aiService.GetReorderAlertsAsync();
            return Ok(alerts);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new { error = "AI prediction service is unavailable." });
        }
    }

    /// <summary>
    /// Returns inventory lots ranked by expiration risk score (highest risk first).
    /// Scores range from 0.0 (safe) to 1.0 (will expire before consumed).
    /// </summary>
    [HttpGet("expiration-risks")]
    public async Task<IActionResult> GetExpirationRisks()
    {
        try
        {
            var risks = await _aiService.GetExpirationRisksAsync();
            return Ok(risks);
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new { error = "AI prediction service is unavailable." });
        }
    }
}
