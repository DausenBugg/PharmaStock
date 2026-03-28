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
        // GET: api/inventorystocks
        // Full stock detail 
        // --------------------------------------------------------------------------------------
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryStockResponse>>> GetInventoryStocks()
        {
            var results = await _inventoryStockService.GetInventoryStocksAsync();
            return Ok(results);
        }

        // --------------------------------------------------------------------------------------
        // GET: api/inventorystocks/list
        // Instock list with key details for inventory management
        // --------------------------------------------------------------------------------------
        [HttpGet("list")]
        public async Task<ActionResult<PagedResponse<InventoryStockListItemResponse>>> GetInStockList(
            [FromQuery] PaginationRequestDto request)
        {
            var result = await _inventoryStockService.GetInStockListAsync(request);
            return Ok(result);
        }

        // --------------------------------------------------------------------------------------
        // Patch: api/inventorystocks/{id}/adjust
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/adjust")]
        public async Task<ActionResult<InventoryStockResponse>> AdjustInventoryStock(
            int id,
            [FromBody] InventoryAdjustQuantityRequest request   )
        {
            try
            {
                var result =
                    await _inventoryStockService.AdjustInventoryStockAsync(id, request);

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
        // Patch: api/inventorystocks/{id}/update-expiration-date
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/update-expiration-date")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateExpirationDate(
            int id,
            [FromBody] UpdatePatchExpirationDateRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateExpirationDateAsync(id, request);
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
        // Patch: api/inventorystocks/{id}/update-beyond-use-date
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/update-beyond-use-date")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateBeyondUseDate(
            int id,
            [FromBody] UpdatePatchBUDRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateBeyondUseDateAsync(id, request);
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
        // Patch: api/inventorystocks/{id}/update-package-ndc
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/update-package-ndc")]
        public async Task<ActionResult<InventoryStockResponse>> UpdatePackageNdc(
            int id,
            [FromBody] UpdatePackageNdcRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdatePackageNdcAsync(id, request);
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
        // Patch: api/inventorystocks/{id}/update-package-description
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}/update-package-description")]
        public async Task<ActionResult<InventoryStockResponse>> UpdatePackageDescription(
            int id,
            [FromBody] UpdatePackageDescriptionRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdatePackageDescriptionAsync(id, request);
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

        /// <summary>
        /// Adding patch endpoints for the override fields for editing at the row level in the UI for Medication
        ///  details that are stored on the InventoryStock entity to allow for flexibility in managing inventory 
        /// without affecting the core Medication data model. This allows users to make adjustments to medication
        ///  details specific to an inventory stock item without impacting the overall medication information used 
        /// across the system.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
    
        [HttpPatch("{id:int}/update-medication-name-override")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateMedicationNameOverride(
            int id,
            [FromBody] UpdateMedicationNameOverrideRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateMedicationNameOverrideAsync(id, request);
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

        [HttpPatch("{id:int}/update-generic-name-override")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateGenericNameOverride(
            int id,
            [FromBody] UpdateGenericNameOverrideRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateGenericNameOverrideAsync(id, request);
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

        [HttpPatch("{id:int}/update-ndc-override")]    
        public async Task<ActionResult<InventoryStockResponse>> UpdateNationalDrugCodeOverride(
            int id,
            [FromBody] UpdateNationalDrugCodeOverrideRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateNationalDrugCodeOverrideAsync(id, request);
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

        [HttpPatch("{id:int}/update-strength-override")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateStrengthOverride(
            int id,
            [FromBody] UpdateStrengthOverrideRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateStrengthOverrideAsync(id, request);
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

        [HttpPatch("{id:int}/update-dosage-form-override")]
        public async Task<ActionResult<InventoryStockResponse>> UpdateDosageFormOverride(
            int id,
            [FromBody] UpdateDosageFormOverrideRequest request)
        {
            try
            {
                var result = await _inventoryStockService.UpdateDosageFormOverrideAsync(id, request);
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