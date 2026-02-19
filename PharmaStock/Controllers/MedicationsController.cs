using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
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
    }
}
