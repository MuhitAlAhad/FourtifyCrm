using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChampionsController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<ChampionsController> _logger;

    public ChampionsController(CrmDbContext context, ILogger<ChampionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/champions
    /// Get all champions with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role = null, [FromQuery] string? search = null)
    {
        var query = _context.Champions.AsNoTracking();

        // Filter by role if provided
        if (!string.IsNullOrEmpty(role))
        {
            query = query.Where(c => c.Role == role);
        }

        // Search by name or email if provided
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => 
                c.Name.Contains(search) || 
                c.Email.Contains(search) ||
                c.OrganizationName.Contains(search)
            );
        }

        var champions = await query
            .OrderByDescending(c => c.PerformanceScore)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(new { champions });
    }

    /// <summary>
    /// GET /api/champions/{id}
    /// Get a champion by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var champion = await _context.Champions.FindAsync(id);

        if (champion == null)
        {
            return NotFound(new { message = "Champion not found" });
        }

        return Ok(champion);
    }

    /// <summary>
    /// POST /api/champions
    /// Create a new champion
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChampionRequest request)
    {
        // Validate email uniqueness
        var existingChampion = await _context.Champions
            .FirstOrDefaultAsync(c => c.Email == request.Email);
        
        if (existingChampion != null)
        {
            return BadRequest(new { message = "A champion with this email already exists" });
        }

        // Calculate conversion rate
        var conversionRate = request.AllocatedSale > 0 
            ? Math.Round((decimal)request.ActiveClients / request.AllocatedSale * 100, 2)
            : 0;

        var champion = new Champion
        {
            Id = $"champion:{Guid.NewGuid()}",
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role ?? string.Empty,
            OrganizationName = request.OrganizationName,
            Address = request.Address,
            AllocatedSale = request.AllocatedSale,
            ActiveClients = request.ActiveClients,
            ConversionRate = conversionRate,
            PerformanceScore = request.PerformanceScore,
            LastActivity = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Champions.Add(champion);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new champion: {ChampionId} - {ChampionName}", champion.Id, champion.Name);

        return CreatedAtAction(nameof(GetById), new { id = champion.Id }, champion);
    }

    /// <summary>
    /// PUT /api/champions/{id}
    /// Update an existing champion
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateChampionRequest request)
    {
        var champion = await _context.Champions.FindAsync(id);

        if (champion == null)
        {
            return NotFound(new { message = "Champion not found" });
        }

        // Check email uniqueness if email is being changed
        if (request.Email != champion.Email)
        {
            var existingChampion = await _context.Champions
                .FirstOrDefaultAsync(c => c.Email == request.Email && c.Id != id);
            
            if (existingChampion != null)
            {
                return BadRequest(new { message = "A champion with this email already exists" });
            }
        }

        // Calculate conversion rate
        var conversionRate = request.AllocatedSale > 0 
            ? Math.Round((decimal)request.ActiveClients / request.AllocatedSale * 100, 2)
            : 0;

        // Update properties
        champion.Name = request.Name;
        champion.Email = request.Email;
        champion.Phone = request.Phone;
        champion.Role = request.Role ?? string.Empty;
        champion.OrganizationName = request.OrganizationName;
        champion.Address = request.Address;
        champion.AllocatedSale = request.AllocatedSale;
        champion.ActiveClients = request.ActiveClients;
        champion.ConversionRate = conversionRate;
        champion.PerformanceScore = request.PerformanceScore;
        champion.LastActivity = DateTime.UtcNow;
        champion.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated champion: {ChampionId} - {ChampionName}", champion.Id, champion.Name);

        return Ok(champion);
    }

    /// <summary>
    /// DELETE /api/champions/{id}
    /// Delete a champion
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var champion = await _context.Champions.FindAsync(id);

        if (champion == null)
        {
            return NotFound(new { message = "Champion not found" });
        }

        _context.Champions.Remove(champion);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted champion: {ChampionId} - {ChampionName}", champion.Id, champion.Name);

        return Ok(new { message = "Champion deleted successfully" });
    }

    /// <summary>
    /// GET /api/champions/stats
    /// Get champion statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var champions = await _context.Champions.ToListAsync();

        var stats = new
        {
            totalChampions = champions.Count,
            totalTargetedClients = champions.Sum(c => c.AllocatedSale),
            totalActiveClients = champions.Sum(c => c.ActiveClients),
            averageConversionRate = champions.Any() 
                ? Math.Round(champions.Average(c => (double)c.ConversionRate), 2)
                : 0,
            averagePerformanceScore = champions.Any()
                ? Math.Round(champions.Average(c => (double)c.PerformanceScore), 2)
                : 0,
            topPerformers = champions
                .OrderByDescending(c => c.PerformanceScore)
                .Take(5)
                .Select(c => new { c.Id, c.Name, c.PerformanceScore })
                .ToList()
        };

        return Ok(stats);
    }

    /// <summary>
    /// POST /api/champions/from-entity
    /// Create a champion from a contact, lead, or client
    /// </summary>
    [HttpPost("from-entity")]
    public async Task<IActionResult> CreateFromEntity([FromBody] CreateChampionFromEntityRequest request)
    {
        // Check if champion with this email already exists
        if (!string.IsNullOrEmpty(request.Email))
        {
            var existing = await _context.Champions
                .FirstOrDefaultAsync(c => c.Email == request.Email);
            if (existing != null)
            {
                return BadRequest(new { message = "This person is already a champion" });
            }
        }

        var champion = new Champion
        {
            Id = $"champion:{Guid.NewGuid()}",
            Name = request.Name,
            Email = request.Email ?? string.Empty,
            Phone = request.Phone ?? string.Empty,
            Role = request.Role ?? string.Empty,
            OrganizationName = request.OrganizationName ?? string.Empty,
            Address = string.Empty,
            AllocatedSale = 0,
            ActiveClients = 0,
            ConversionRate = 0,
            PerformanceScore = 0,
            LastActivity = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Champions.Add(champion);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created champion from {SourceType}: {ChampionId} - {ChampionName}",
            request.SourceType, champion.Id, champion.Name);

        return CreatedAtAction(nameof(GetById), new { id = champion.Id }, champion);
    }

    /// <summary>
    /// DELETE /api/champions/by-email/{email}
    /// Remove champion status by email
    /// </summary>
    [HttpDelete("by-email/{email}")]
    public async Task<IActionResult> DeleteByEmail(string email)
    {
        var champion = await _context.Champions
            .FirstOrDefaultAsync(c => c.Email == email);

        if (champion == null)
        {
            return NotFound(new { message = "Champion not found" });
        }

        _context.Champions.Remove(champion);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Removed champion by email: {Email}", email);

        return Ok(new { message = "Champion status removed successfully" });
    }

    /// <summary>
    /// GET /api/champions/check/{email}
    /// Check if an email is already a champion
    /// </summary>
    [HttpGet("check/{email}")]
    public async Task<IActionResult> CheckByEmail(string email)
    {
        var champion = await _context.Champions
            .FirstOrDefaultAsync(c => c.Email == email);

        return Ok(new { isChampion = champion != null, champion });
    }
}

// ============ DTOs ============

public class CreateChampionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int AllocatedSale { get; set; }
    public int ActiveClients { get; set; }
    public decimal PerformanceScore { get; set; }
}

public class UpdateChampionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int AllocatedSale { get; set; }
    public int ActiveClients { get; set; }
    public decimal PerformanceScore { get; set; }
}

public class CreateChampionFromEntityRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? OrganizationName { get; set; }
    public string SourceType { get; set; } = string.Empty; // "contact", "lead", or "client"
    public string? SourceId { get; set; }
}
