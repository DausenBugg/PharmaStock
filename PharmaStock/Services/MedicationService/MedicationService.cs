using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaStock.Data;
using PharmaStock.Data.Entities;
using PharmaStock.Dtos.Requests;
using PharmaStock.Dtos.Responses;
using PharmaStock.Mappings;

namespace PharmaStock.Services
{
    public class MedicationService : MedicationServiceInterface
    {
        private readonly PharmaStockDbContext _context;

        public MedicationService(PharmaStockDbContext context)
        {
            _context = context;
        }

        // ---------------------------------------------------------------------------------------
        // GET: All medications with optional filtering by name, manufacturer, form, and strength
        // This endpoint retrieves a list of medications, optionally filtered by the provided query parameters
        // It returns a list of MedicationResponse DTOs that match the filter criteria
        // ---------------------------------------------------------------------------------------

        public async Task<List<MedicationResponse>> GetAllMedicationsAsync(
            [FromQuery] string? name,
            [FromQuery] string? manufacturer,
            [FromQuery] string? form,
            [FromQuery] string? NationalDrugCode
        )
        {
            var query = _context.Medications.AsQueryable();
        
            if (!string.IsNullOrWhiteSpace(name)) 
                query = query.Where(m => EF.Functions.Like(m.Name, $"%{name}%"));

            if (!string.IsNullOrWhiteSpace(manufacturer))
                query = query.Where(m => EF.Functions.Like(m.Manufacturer, $"%{manufacturer}%"));

            if (!string.IsNullOrWhiteSpace(form))
                query = query.Where(m => EF.Functions.Like(m.Form, $"%{form}%"));

            if (!string.IsNullOrWhiteSpace(NationalDrugCode))
                query = query.Where(m => EF.Functions.Like(m.NationalDrugCode, $"%{NationalDrugCode}%"));

            var medications = await query.ToListAsync();
            return medications.Select(m => m.ToMedicationResponse()).ToList();
        }

        // --------------------------------------------------------------------------------------
        // GET: api/medications/{id}
        // This endpoint retrieves a single medication by its ID
        // It returns a MedicationResponse DTO if the medication is found, or a 404 Not Found response if it is not
        // --------------------------------------------------------------------------------------
        public async Task<MedicationResponse?> GetMedicationByIdAsync(int id)
        {
            var medication = await _context.Medications
                .Include(m => m.InventoryStocks)
                .FirstOrDefaultAsync(m => m.MedicationId == id);

            return medication?.ToMedicationResponse();
        }

        // --------------------------------------------------------------------------------------
        // POST: api/medications
        // This endpoint creates a new medication using the data provided in the CreateMedicationDto
        // It returns a 201 Created response with the created MedicationResponse if successful
        // If the request is invalid, it returns a 400 Bad Request response with validation error messages
        // If a medication with the same National Drug Code already exists, it returns a 409
        // Conflict response with an appropriate error message
        // --------------------------------------------------------------------------------------
        public async Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs, MedicationResponse? data)>
            CreateAsync(CreateMedicationDto request)
        {
            var nationalDrugCode = request.NationalDrugCode.Trim();

            var existingMedication = await _context.Medications
                .AsNoTracking()
                .AnyAsync(m => m.NationalDrugCode == nationalDrugCode);
            
            if (existingMedication)            
                return (false, $"Medication with National Drug Code '{nationalDrugCode}' already exists.", null, null);

            var newMedication = new Medication
            {
                Name = request.Name.Trim(),
                NationalDrugCode = nationalDrugCode,
                Form = request.Form.Trim(),
                Strength = request.Strength.Trim(),
                Manufacturer = request.Manufacturer.Trim(),
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };

            _context.Medications.Add(newMedication);
            await _context.SaveChangesAsync();

            return (true, null, null, newMedication.ToMedicationResponse());    
        }

        // --------------------------------------------------------------------------------------
        // PUT: api/medications/{id}
        // This endpoint updates an existing medication by its ID in full
        // It accepts a MedicationUpdateRequest DTO in the request body and returns the updated MedicationResponse
        // If the medication is not found, it returns a 404 Not Found response with an appropriate error message
        // If the request is invalid, it returns a 400 Bad Request response with validation error messages
        // If a medication with the same National Drug Code already exists (excluding the current medication), it returns a 409
        // Conflict response with an appropriate error message
        // --------------------------------------------------------------------------------------
        public async Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs, MedicationResponse? data)>
            UpdateAsync(int id, UpdateMedicationDto request)
        {
            var medication = await _context.Medications
                .Include(m => m.InventoryStocks)
                .FirstOrDefaultAsync(m => m.MedicationId == id);

            if (medication == null)            
                return (false, $"Medication with ID {id} not found.", null, null);

            var NationalDrugCode = request.NationalDrugCode.Trim();

            var existingMedication = await _context.Medications
                .AsNoTracking()
                .AnyAsync(m => m.NationalDrugCode == NationalDrugCode && m.MedicationId != id);
            
            if (existingMedication)            
                return (false, $"Medication with National Drug Code '{NationalDrugCode}' already exists.", null, null);

            medication.Name = request.Name.Trim();
            medication.NationalDrugCode = NationalDrugCode;
            medication.Form = request.Form.Trim();
            medication.Strength = request.Strength.Trim();
            medication.Manufacturer = request.Manufacturer.Trim();
            medication.UpdatedAtUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (true, null, null, medication.ToMedicationResponse());
        }

        // --------------------------------------------------------------------------------------
        // PATCH: api/medications/{id}
        // This endpoint partially updates an existing medication by its ID
        // It accepts a MedicationUpdatePatchRequest DTO in the request body and returns the updated Medication
        // If the medication is not found, it returns a 404 Not Found response with an appropriate error message
        // If the request is invalid, it returns a 400 Bad Request response with validation error messages
        // If a medication with the same National Drug Code already exists (excluding the current medication),
        // it returns a 409 Conflict response with an appropriate error message
        // --------------------------------------------------------------------------------------
        public async Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs)>
            PatchAsync(int id, UpdatePatchMedicationDto request)
        {
            var medication = await _context.Medications
                .Include(m => m.InventoryStocks)
                .FirstOrDefaultAsync(m => m.MedicationId == id);

            if (medication == null)            
                return (false, $"Medication with ID {id} not found.", null);


            if (request.Description != null)
            {
                medication.Description = request.Description.Trim();
            }

            if (request.NationalDrugCode != null)
            {
                var NationalDrugCode = request.NationalDrugCode.Trim();

                if (string.IsNullOrWhiteSpace(NationalDrugCode))
                    return (false, "Medication National Drug Code cannot be empty.", null);

                var existingMedication = await _context.Medications
                    .AsNoTracking()
                    .AnyAsync(m => m.NationalDrugCode == NationalDrugCode && m.MedicationId != id);
                
                if (existingMedication)                
                    return (false, $"Medication with National Drug Code '{NationalDrugCode}' already exists.", null);
                
                medication.NationalDrugCode = NationalDrugCode;
            }

            if (request.Name != null)
            {
                var name = request.Name.Trim();

                if (string.IsNullOrWhiteSpace(name))
                    return (false, "Medication name cannot be empty.", null);

                medication.Name = name;
            }

            if (request.GenericName != null)
            {
                var genericName = request.GenericName.Trim();

                if (string.IsNullOrWhiteSpace(genericName))
                    return (false, "Medication generic name cannot be empty.", null);

                medication.GenericName = genericName;       
            }

            if (request.Form != null)
            {
                var form = request.Form.Trim();

                if (string.IsNullOrWhiteSpace(form))
                    return (false, "Medication form cannot be empty.", null);

                medication.Form = form; 
            }

            if (request.Strength != null)
            {
                var strength = request.Strength.Trim();

                if (string.IsNullOrWhiteSpace(strength))
                    return (false, "Medication strength cannot be empty.", null);

                medication.Strength = strength;
            }

            if (request.Manufacturer != null)
            {
                var manufacturer = request.Manufacturer.Trim();

                if (string.IsNullOrWhiteSpace(manufacturer))
                    return (false, "Medication manufacturer cannot be empty.", null);

                medication.Manufacturer = manufacturer;
            }

            medication.UpdatedAtUtc = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, null, null);
        }

        // --------------------------------------------------------------------------------------
        // DELETE: api/medications/{id}
        // This endpoint deletes an existing medication by its ID
        // If the medication is not found, it returns a 404 Not Found response with an
        // appropriate error message
        // If the medication has associated inventory stocks, it returns a 400 Bad Request response
        // with an appropriate error message indicating that the medication cannot be deleted
        // --------------------------------------------------------------------------------------
        public async Task<(bool ok, string? error, ErrorEventArgs? errorEventArgs)> 
            DeleteAsync(int id)
        {
            var medication = await _context.Medications
                .Include(m => m.InventoryStocks)
                .FirstOrDefaultAsync(m => m.MedicationId == id);

            if (medication == null)            
                return (false, $"Medication with ID {id} not found.", null);

            if (medication.InventoryStocks.Any())            
                return (false, $"Medication with ID {id} cannot be deleted because it has associated inventory stocks.", null);

            _context.Medications.Remove(medication);
            await _context.SaveChangesAsync();
            return (true, null, null);
        }
    }
}