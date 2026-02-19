using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;


namespace PharmaStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicationsController : ControllerBase
    {
        // TODO: implement SCRUM-33 to SCRUM-36
        // This controller will handle CRUD operations for Medication entities
        // It will use the PharmaStockDbContext to interact with the database
        // and will return appropriate HTTP responses based on the outcome of each operation.

        private readonly PharmaStockDbContext _context;

        public MedicationsController(PharmaStockDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------------------------------------------
        // GET: api/medications
        // This endpoint retrieves a list of medications with optional search parameters
        // It returns a list of MedicationResponse DTOs that include medication details and associated inventory stock
        // Search parameters include:
        // - searchByName: filters medications by name (partial match)
        // - searchByManufacturer: filters medications by manufacturer (partial match)
        // - searchByForm: filters medications by form (partial match)
        // - searchByNationalDrugCode: filters medications by national drug code (partial match)
        // ----------------------------------------------------------------------------------------
        [HttpGet]
        public async Task<ActionResult<List<MedicationResponse>>> GetAllMed(
            [FromQuery] string? searchByName,
            [FromQuery] string? searchByManufacturer,
            [FromQuery] string? searchByForm,
            [FromQuery] string? searchByNationalDrugCode
        )
        {
            var query = _context.Medications
                .AsNoTracking()
                .Include(m => m.InventoryStocks)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchByName))
                query = query.Where(m => EF.Functions.Like(m.Name, $"%{searchByName}%"));

            if (!string.IsNullOrWhiteSpace(searchByManufacturer))
                query = query.Where(m => EF.Functions.Like(m.Manufacturer, $"%{searchByManufacturer}%"));

            if (!string.IsNullOrWhiteSpace(searchByForm))
                query = query.Where(m => EF.Functions.Like(m.Form, $"%{searchByForm}%"));

            if (!string.IsNullOrWhiteSpace(searchByNationalDrugCode))
                query = query.Where(m => EF.Functions.Like(m.NationalDrugCode, $"%{searchByNationalDrugCode}%"));

            var response = await query
                .Select(m => new MedicationResponse
                {
                    Id = m.Id,
                    Name = m.Name,
                    Manufacturer = m.Manufacturer,
                    Form = m.Form,
                    NationalDrugCode = m.NationalDrugCode,
                    Inventory = m.InventoryStocks.Select(s => new InventoryStockResponse
                    {
                        Id = s.Id,
                        QuantityOnHand = s.QuantityOnHand,
                        ReorderLevel = s.ReorderLevel,
                        BinLocation = s.BinLocation,
                        LotNumber = s.LotNumber,
                        ExpirationDate = s.ExpirationDate,
                        BeyondUseDate = s.BeyondUseDate
                    }).ToList()
                })
                .ToListAsync();

            return Ok(response);
        }

        // --------------------------------------------------------------------------------------
        // GET: api/medications/{id}
        // This endpoint retrieves a single medication by its ID
        // It returns a MedicationResponse DTO that includes medication details and associated inventory stock
        // If the medication is not found, it returns a 404 Not Found response with an appropriate error message
        // --------------------------------------------------------------------------------------
        [HttpGet("{id:int}")]
        public async Task<ActionResult<MedicationResponse>> GetMedicationById(int id)
        {
            var medication = await _context.Medications
                .AsNoTracking()
                .Include(m => m.InventoryStocks)
                .Where(m => m.Id == id)
                .Select(m => new MedicationResponse
                {
                    Id = m.Id,
                    Name = m.Name,
                    Manufacturer = m.Manufacturer,
                    Form = m.Form,
                    NationalDrugCode = m.NationalDrugCode,
                    Inventory = m.InventoryStocks.Select(s => new InventoryStockResponse
                    {
                        Id = s.Id,
                        QuantityOnHand = s.QuantityOnHand,
                        ReorderLevel = s.ReorderLevel,
                        BinLocation = s.BinLocation,
                        LotNumber = s.LotNumber,
                        ExpirationDate = s.ExpirationDate,
                        BeyondUseDate = s.BeyondUseDate
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (medication == null)
                return NotFound(new { message = $"Medication with ID {id} not found." });

            var response = new MedicationResponse
            {
                Id = medication.Id,
                Name = medication.Name,
                Manufacturer = medication.Manufacturer,
                Form = medication.Form,
                NationalDrugCode = medication.NationalDrugCode,
                Inventory = medication.Inventory.Select(s => new InventoryStockResponse
                {
                    Id = s.Id,
                    QuantityOnHand = s.QuantityOnHand,
                    ReorderLevel = s.ReorderLevel,
                    BinLocation = s.BinLocation,
                    LotNumber = s.LotNumber,
                    ExpirationDate = s.ExpirationDate,
                    BeyondUseDate = s.BeyondUseDate
                }).ToList()
            };

            return Ok(response);
        }

        // --------------------------------------------------------------------------------------
        // POST: api/medications
        // This endpoint creates a new medication
        // It accepts a MedicationCreateRequest DTO in the request body and returns the created MedicationResponse
        // If the request is invalid, it returns a 400 Bad Request response with validation error messages
        // --------------------------------------------------------------------------------------
        [HttpPost]
        public async Task<ActionResult<MedicationResponse>> CreateMedication([FromBody] CreateMedicationDto request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

        
            // Normalize input data
            var NationalDrugCode = request.NationalDrugCode.Trim();
            var Name = request.Name.Trim();
            var Form = request.Form?.Trim();
            var Strength = request.Strength.Trim();
            var Manufacturer = request.Manufacturer?.Trim();

            // Check for existing medication with the same National Drug Code
            var existingMedication = await _context.Medications
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.NationalDrugCode == NationalDrugCode);

            if (existingMedication != null)
                return Conflict(new { message = $"Medication with National Drug Code '{NationalDrugCode}' already exists." });

            var newMedication = new Medication
            {
                Name = Name,
                NationalDrugCode = NationalDrugCode,
                Form = Form,
                Strength = Strength,
                Manufacturer = Manufacturer     
            };

            _context.Medications.Add(newMedication);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Handle potential database update exceptions, such as unique constraint violations
                return StatusCode(500, new { message = $"An Medication with National Drug Code '{NationalDrugCode}' already exists." });
            }

            // Return the created medication with a 201 Created response
            var response = new MedicationResponse
            {
                Id = newMedication.Id,
                Name = newMedication.Name,
                Manufacturer = newMedication.Manufacturer,
                Form = newMedication.Form,
                Strength = newMedication.Strength,
                NationalDrugCode = newMedication.NationalDrugCode,
                Inventory = new List<InventoryStockResponse>() // New medication will have no inventory stock initially
            };

            return CreatedAtAction(nameof(GetMedicationById), new { id = newMedication.Id }, response);
        }







    }
}
