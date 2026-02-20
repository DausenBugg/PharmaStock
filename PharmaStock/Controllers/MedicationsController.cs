using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;
using PharmaStock.Services;


namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicationsController : ControllerBase
    {

        private readonly MedicationServiceInterface _medicationService;
         private readonly PharmaStockDbContext _context;

        public MedicationsController(MedicationServiceInterface medicationService, PharmaStockDbContext context)
        {
            _medicationService = medicationService;
            _context = context;
        }


       


        // --------------------------------------------------------------------------------------
        // GET: api/medications
        // ----------------------------------------------------------------------------------------
        [HttpGet]
        public async Task<ActionResult<List<MedicationResponse>>> GetAllMedications(
             [FromQuery] string? name,
             [FromQuery] string? manufacturer,
             [FromQuery] string? form,
             [FromQuery] string? NationalDrugCode
        )
        {
            var medications = await _medicationService.GetAllMedicationsAsync(name, manufacturer, form, NationalDrugCode);
            return Ok(medications);
        }

        // --------------------------------------------------------------------------------------
        // GET: api/medications/{id}
        // --------------------------------------------------------------------------------------
        [HttpGet("{id:int}")]
        public async Task<ActionResult<MedicationResponse>> GetMedicationById(int id)
        {
            var medication = await _medicationService.GetMedicationByIdAsync(id);
            if (medication == null)
                return NotFound(new { message = $"Medication with ID {id} not found." });

            return Ok(medication);
        }
        
        // --------------------------------------------------------------------------------------
        // POST: api/medications
        // --------------------------------------------------------------------------------------
        // This endpoint creates a new medication
        [HttpPost]
        public async Task<ActionResult<MedicationResponse>> CreateMedication([FromBody] CreateMedicationDto request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var result = await _medicationService.CreateAsync(request);

            if (!result.ok)
            {
                return result.error switch
                {
                    "DUPLICATE_NDC" => Conflict(new
                    {
                        message = $"Medication with National Drug Code '{request.NationalDrugCode}' already exists."
                    }),
                    "VALIDATION_ERROR" => BadRequest(new
                    {
                        message = "Invalid request data.",
                        errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                    }),
                    _ => StatusCode(500, new { message = "An unexpected error occurred." })
                };
            }

            return CreatedAtAction(nameof(GetMedicationById),
                new { id = result.data!.MedicationId },
                result.data);
        }



        // --------------------------------------------------------------------------------------
        // PUT: api/medications/{id}
        // --------------------------------------------------------------------------------------
        [HttpPut("{id:int}")]
        public async Task<ActionResult<MedicationResponse>> UpdateMedication(int id, [FromBody] UpdateMedicationDto request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var result = await _medicationService.UpdateAsync(id, request);

            if (!result.ok)
            {
                return result.error switch
                {
                    "NOT_FOUND" => NotFound(new { message = $"Medication with ID {id} not found." }),
                    "DUPLICATE_NDC" => Conflict(new { message = $"Medication with National Drug Code '{request.NationalDrugCode}' already exists." }),
                    _ => StatusCode(500, new { message = "An unexpected error occurred." })
                };
            }

            return Ok(result.data);
        }

        // --------------------------------------------------------------------------------------
        // PATCH: api/medications/{id}
        // --------------------------------------------------------------------------------------
        [HttpPatch("{id:int}")]
        public async Task<ActionResult> PatchMedication(int id, [FromBody] UpdatePatchMedicationDto request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var result = await _medicationService.PatchAsync(id, request);

            if (!result.ok)
            {
                return result.error switch
                {
                    "NOT_FOUND" => NotFound(new { message = $"Medication with ID {id} not found." }),
                    "DUPLICATE_NDC" => Conflict(new { message = $"Medication with National Drug Code '{request.NationalDrugCode}' already exists." }),
                    _ => StatusCode(500, new { message = "An unexpected error occurred." })
                };
            }

            return NoContent();
        }   

        // --------------------------------------------------------------------------------------
        // DELETE: api/medications/{id}
        // --------------------------------------------------------------------------------------
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteMedication(int id)
        {
            var result = await _medicationService.DeleteAsync(id);

            if (!result.ok)
            {
                return result.error switch
                {
                    "NOT_FOUND" => NotFound(new { message = $"Medication with ID {id} not found." }),
                    _ => StatusCode(500, new { message = "An unexpected error occurred." })
                };
            }

            return NoContent();
        }
    }
}
