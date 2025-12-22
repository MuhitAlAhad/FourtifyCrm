using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(CrmDbContext context, ILogger<ClientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/clients
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var query = _context.Clients
            .Include(c => c.Organisation)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        var clients = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(new
        {
            clients = clients.Select(c => MapToDto(c))
        });
    }

    /// <summary>
    /// GET /api/clients/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var client = await _context.Clients
            .Include(c => c.Organisation)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        return Ok(MapToDto(client));
    }

    /// <summary>
    /// POST /api/clients
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
    {
        // Verify organisation exists
        var organisation = await _context.Organisations.FindAsync(request.OrganisationId);
        if (organisation == null)
        {
            return BadRequest(new { message = "Organisation not found" });
        }

        // Check if client already exists for this organisation
        var existingClient = await _context.Clients
            .FirstOrDefaultAsync(c => c.OrganisationId == request.OrganisationId);
        if (existingClient != null)
        {
            return BadRequest(new { message = "A client already exists for this organisation" });
        }

        var client = new Client
        {
            Id = $"client:{Guid.NewGuid()}",
            OrganisationId = request.OrganisationId,
            Plan = request.Plan ?? "Professional",
            Status = request.Status ?? "onboarding",
            Mrr = request.Mrr ?? 0,
            ContractStart = request.ContractStart,
            ContractEnd = request.ContractEnd,
            DispCompliant = request.DispCompliant ?? false,
            Notes = request.Notes ?? "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        // Reload with Organisation included
        await _context.Entry(client).Reference(c => c.Organisation).LoadAsync();

        _logger.LogInformation("Created client {ClientId} for organisation {OrgId}", client.Id, request.OrganisationId);

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, MapToDto(client));
    }

    /// <summary>
    /// PUT /api/clients/{id}
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateClientRequest request)
    {
        var client = await _context.Clients
            .Include(c => c.Organisation)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        if (request.Plan != null) client.Plan = request.Plan;
        if (request.Status != null) client.Status = request.Status;
        if (request.Mrr.HasValue) client.Mrr = request.Mrr.Value;
        if (request.ContractStart.HasValue) client.ContractStart = request.ContractStart;
        if (request.ContractEnd.HasValue) client.ContractEnd = request.ContractEnd;
        if (request.DispCompliant.HasValue) client.DispCompliant = request.DispCompliant.Value;
        if (request.Notes != null) client.Notes = request.Notes;

        client.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(client));
    }

    /// <summary>
    /// DELETE /api/clients/{id}
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted client {ClientId}", id);

        return NoContent();
    }

    /// <summary>
    /// GET /api/clients/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalClients = await _context.Clients.CountAsync();
        var activeClients = await _context.Clients.CountAsync(c => c.Status == "active");
        var onboarding = await _context.Clients.CountAsync(c => c.Status == "onboarding");
        var churned = await _context.Clients.CountAsync(c => c.Status == "churned");
        var totalMrr = await _context.Clients.Where(c => c.Status == "active").SumAsync(c => c.Mrr);
        var dispCompliant = await _context.Clients.CountAsync(c => c.DispCompliant);

        return Ok(new
        {
            totalClients,
            activeClients,
            onboarding,
            churned,
            totalMrr,
            dispCompliantCount = dispCompliant,
            dispComplianceRate = totalClients > 0 ? (double)dispCompliant / totalClients * 100 : 0
        });
    }

    private static object MapToDto(Client c) => new
    {
        id = c.Id,
        organisationId = c.OrganisationId,
        organisationName = c.Organisation?.Name,
        plan = c.Plan,
        status = c.Status,
        mrr = c.Mrr,
        contractStart = c.ContractStart,
        contractEnd = c.ContractEnd,
        dispCompliant = c.DispCompliant,
        notes = c.Notes,
        createdAt = c.CreatedAt,
        updatedAt = c.UpdatedAt
    };
}

public class CreateClientRequest
{
    public string OrganisationId { get; set; } = string.Empty;
    public string? Plan { get; set; }
    public string? Status { get; set; }
    public decimal? Mrr { get; set; }
    public DateTime? ContractStart { get; set; }
    public DateTime? ContractEnd { get; set; }
    public bool? DispCompliant { get; set; }
    public string? Notes { get; set; }
}

public class UpdateClientRequest
{
    public string? Plan { get; set; }
    public string? Status { get; set; }
    public decimal? Mrr { get; set; }
    public DateTime? ContractStart { get; set; }
    public DateTime? ContractEnd { get; set; }
    public bool? DispCompliant { get; set; }
    public string? Notes { get; set; }
}
