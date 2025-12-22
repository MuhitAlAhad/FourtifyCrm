using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<ImportController> _logger;

    public ImportController(CrmDbContext context, ILogger<ImportController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Clear all imported data (contacts and organisations)
    /// DELETE /api/import/clear-all
    /// </summary>
    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAll()
    {
        try
        {
            // Delete in order due to foreign keys
            var leadsDeleted = await _context.Database.ExecuteSqlRawAsync("DELETE FROM leads");
            var contactsDeleted = await _context.Database.ExecuteSqlRawAsync("DELETE FROM contacts");
            var orgsDeleted = await _context.Database.ExecuteSqlRawAsync("DELETE FROM organisations");
            
            return Ok(new { 
                success = true, 
                message = $"Cleared: {orgsDeleted} organisations, {contactsDeleted} contacts, {leadsDeleted} leads" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing data");
            return StatusCode(500, $"Clear failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Import prospects from Excel file
    /// POST /api/import/prospects
    /// </summary>
    [HttpPost("prospects")]
    public async Task<IActionResult> ImportProspects(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only .xlsx files are supported");

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            var result = await ProcessExcelFile(stream);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing prospects");
            return StatusCode(500, $"Import failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Import from file path (for server-side import)
    /// POST /api/import/prospects-from-path
    /// </summary>
    [HttpPost("prospects-from-path")]
    public async Task<IActionResult> ImportProspectsFromPath([FromBody] ImportPathRequest request)
    {
        if (string.IsNullOrEmpty(request?.FilePath))
            return BadRequest("FilePath is required");

        if (!System.IO.File.Exists(request.FilePath))
            return NotFound($"File not found: {request.FilePath}");

        try
        {
            using var stream = System.IO.File.OpenRead(request.FilePath);
            var result = await ProcessExcelFile(stream);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing prospects from path");
            return StatusCode(500, $"Import failed: {ex.Message}");
        }
    }

    private async Task<ImportResult> ProcessExcelFile(Stream stream)
    {
        var result = new ImportResult();
        var organisationsToAdd = new Dictionary<string, Organisation>();
        var contactsToAdd = new List<Contact>();

        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        foreach (var row in rows)
        {
            try
            {
                var name = row.Cell(1).GetString().Trim();
                var company = row.Cell(2).GetString().Trim();
                var email = row.Cell(3).GetString().Trim();
                var phone = row.Cell(4).GetString().Trim();
                var supplierName = row.Cell(5).GetString().Trim();
                var abn = row.Cell(6).GetString().Trim();
                var state = row.Cell(7).GetString().Trim();
                var postcode = row.Cell(8).GetString().Trim();
                var deedStart = row.Cell(9).GetString().Trim();
                var deedEnd = row.Cell(10).GetString().Trim();

                if (string.IsNullOrWhiteSpace(company) || string.IsNullOrWhiteSpace(name))
                {
                    result.SkippedRows++;
                    continue;
                }

                // Create or get organisation (unique by ABN or Company name)
                var orgKey = !string.IsNullOrEmpty(abn) ? abn : company.ToUpperInvariant();
                
                if (!organisationsToAdd.ContainsKey(orgKey))
                {
                    // Check if org already exists in database
                    var existingOrg = await _context.Organisations
                        .FirstOrDefaultAsync(o => o.Abn == abn || o.Name == company);

                    if (existingOrg != null)
                    {
                        organisationsToAdd[orgKey] = existingOrg;
                    }
                    else
                    {
                        var newOrg = new Organisation
                        {
                            Id = $"org:{Guid.NewGuid()}",
                            Name = company,
                            Abn = abn,
                            State = state,
                            Postcode = postcode,
                            SupplierName = supplierName,
                            DeedStartDate = deedStart,
                            DeedEndDate = deedEnd,
                            Industry = "Defence", // Default for this import
                            CreatedBy = "Excel Import",
                            CreatedAt = DateTime.UtcNow
                        };
                        organisationsToAdd[orgKey] = newOrg;
                        _context.Organisations.Add(newOrg);
                        result.OrganisationsCreated++;
                    }
                }

                var org = organisationsToAdd[orgKey];

                // Parse name into first/last
                var nameParts = name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var firstName = nameParts.Length > 0 ? nameParts[0] : name;
                var lastName = nameParts.Length > 1 ? nameParts[1] : "";

                // Check if contact already exists
                var existingContact = await _context.Contacts
                    .FirstOrDefaultAsync(c => c.Email == email && c.OrganisationId == org.Id);

                if (existingContact == null)
                {
                    var contact = new Contact
                    {
                        Id = $"contact:{Guid.NewGuid()}",
                        OrganisationId = org.Id,
                        FirstName = firstName,
                        LastName = lastName,
                        Email = email,
                        Phone = phone,
                        IsPrimary = !contactsToAdd.Any(c => c.OrganisationId == org.Id),
                        CreatedBy = "Excel Import",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Contacts.Add(contact);
                    contactsToAdd.Add(contact);
                    result.ContactsCreated++;
                }
                else
                {
                    result.SkippedRows++;
                }

                result.ProcessedRows++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error processing row");
                result.SkippedRows++;
            }
        }

        await _context.SaveChangesAsync();
        
        result.Success = true;
        result.Message = $"Import completed: {result.OrganisationsCreated} organisations, {result.ContactsCreated} contacts created";
        
        return result;
    }
}

public class ImportPathRequest
{
    public string FilePath { get; set; } = string.Empty;
}

public class ImportResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int ProcessedRows { get; set; }
    public int OrganisationsCreated { get; set; }
    public int ContactsCreated { get; set; }
    public int SkippedRows { get; set; }
}
