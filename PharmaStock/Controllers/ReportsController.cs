using Microsoft.AspNetCore.Mvc;
using PharmaStock.Dtos.Requests.Medication;


namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("expired")]
        public async Task<IActionResult> GetExpiredMedicationReport([FromQuery] ExpiredMedicationReportRequestDto request)
        {
            try
            {
                var result = await _reportService.GetExpiredMedicationsReportAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("expired/export")]
        public async Task<IActionResult> ExportExpiredMedicationReport([FromQuery] ExpiredMedicationReportRequestDto request)
        {
            try
            {
                var csvBytes = await _reportService.ExportExpiredMedicationsToCsvAsync(request);
                var fileName = $"expired-medications-report-{DateTime.UtcNow:yyyy-MM-dd}.csv";

                return File(csvBytes, "text/csv", fileName);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}