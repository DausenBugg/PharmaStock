using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Requests.Inventory;
using PharmaStock.Dtos.Responses;
using PharmaStock.Services;

namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryStocksController : ControllerBase
    {
        private readonly InventoryStockServiceInterface _inventoryStockService;

        private readonly PharmaStockDbContext _context;

        public InventoryStocksController(InventoryStockServiceInterface inventoryStockService, PharmaStockDbContext context)
        {
            _inventoryStockService = inventoryStockService;
            _context = context;
        }

        // --------------------------------------------------------------------------------------
        // Patch: api/inventorystocks/{id}/adjust
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/adjust")]
        public async Task<ActionResult<InventoryStockResponse>> AdjustInventoryStock(
            int inventoryStockId,
            [FromBody] InventoryAdjustQuantityRequest request   )
        {
            try
            {
                var result =
                    await _inventoryStockService.AdjustInventoryStockAsync(inventoryStockId, request);

                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // --------------------------------------------------------------------------------------
        // GET: api/inventorystocks/{id}
        // --------------------------------------------------------------------------------------
        [HttpGet("{id:int}")]
        public async Task<ActionResult<InventoryStockResponse>> GetInventoryStockById(int id)
        {
            try
            {
                var result = await _inventoryStockService.GetInventoryStockByIdAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        // --------------------------------------------------------------------------------------
        // POST: api/inventorystocks
        // --------------------------------------------------------------------------------------
        [HttpPost]
        public async Task<ActionResult<InventoryStockResponse>> CreateInventoryStockAsync([FromBody] CreateInventoryStockDto request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var result = await _inventoryStockService.CreateInventoryStockAsync(request);
                return CreatedAtAction(nameof(GetInventoryStockById), new { id = result.InventoryStockId }, result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }

        }

    }
}