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
    // Log the incoming request for monitoring and debugging purposes
    //
    try
    {
        // Tys to call the AI prediction service to get reorder alerts based on current inventory data
        Console.WriteLine("GET /api/predictions/reorder-alerts hit");

        var alerts = await _aiService.GetReorderAlertsAsync();
        return Ok(alerts);
    }
    catch (TaskCanceledException ex)
    {
        // Write and 504 error response if the AI prediction service call times out, including the exception message for debugging
        Console.WriteLine($"Timeout: {ex}");
        return StatusCode(504, new
        {
            error = "AI prediction service timed out.",
            detail = ex.Message
        });
    }
    catch (HttpRequestException ex)
    {
        // Write and 503 error response if the AI prediction service is unavailable, including the exception message for debugging
        Console.WriteLine($"HTTP error: {ex}");
        return StatusCode(503, new
        {
            error = "AI prediction service unavailable.",
            detail = ex.Message
        });
    }
    catch (Exception ex)
    {
        // Write and 500 error response for any other unhandled exceptions, including the exception message for debugging
        Console.WriteLine($"Unhandled error: {ex}");
        return StatusCode(500, new
        {
            error = "Reorder prediction failed.",
            detail = ex.Message
        });
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
        // Tys to call the AI prediction service to get expiration risk scores for inventory lots
        Console.WriteLine("GET /api/predictions/expiration-risks hit");

        var risks = await _aiService.GetExpirationRisksAsync();
        return Ok(risks);
    }
    catch (TaskCanceledException ex)
    {
        // Write and 504 error response if the AI prediction service call times out, including the exception message for debugging
        Console.WriteLine($"Timeout: {ex}");
        return StatusCode(504, new
        {
            error = "AI prediction service timed out.",
            detail = ex.Message
        });
    }
    catch (HttpRequestException ex)
    {
        // Write and 503 error response if the AI prediction service is unavailable, including the exception message for debugging
        Console.WriteLine($"HTTP error: {ex}");
        return StatusCode(503, new
        {
            error = "AI prediction service unavailable.",
            detail = ex.Message
        });
    }
    catch (Exception ex)
    {
        // Write and 500 error response for any other unhandled exceptions, including the exception message for debugging
        Console.WriteLine($"Unhandled error: {ex}");
        return StatusCode(500, new
        {
            error = "Expiration prediction failed.",
            detail = ex.Message
        });
    }
}
}
