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

        // Get all client IDs
        var clientIds = clients.Select(c => c.Id).ToList();
        
        // Get total invoice amounts for all clients in one query
        var invoiceTotals = await _context.Invoices
            .Where(i => clientIds.Contains(i.ClientId))
            .GroupBy(i => i.ClientId)
            .Select(g => new { ClientId = g.Key, TotalAmount = g.Sum(i => i.TotalAmount) })
            .ToDictionaryAsync(x => x.ClientId, x => x.TotalAmount);

        return Ok(new
        {
            clients = clients.Select(c => MapToDto(c, invoiceTotals.GetValueOrDefault(c.Id, 0)))
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

        // Get total invoice amount for this client
        var totalInvoices = await _context.Invoices
            .Where(i => i.ClientId == id)
            .SumAsync(i => i.TotalAmount);

        return Ok(MapToDto(client, totalInvoices));
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

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, MapToDto(client, 0));
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

        // Get total invoice amount for this client
        var totalInvoices = await _context.Invoices
            .Where(i => i.ClientId == id)
            .SumAsync(i => i.TotalAmount);

        return Ok(MapToDto(client, totalInvoices));
    }

    /// <summary>
    /// DELETE /api/clients/{id}
    /// </summary>
    /// <summary>
    /// DELETE /api/clients/{id}
    /// Deletes a client and all related financial records (invoices, payments)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        // Use a transaction to ensure all-or-nothing deletion
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Get counts for logging
            var invoiceIds = await _context.Invoices
                .Where(i => i.ClientId == id)
                .Select(i => i.Id)
                .ToListAsync();
            
            var invoiceCount = invoiceIds.Count;
            var paymentCount = await _context.Payments.CountAsync(p => p.ClientId == id);

            _logger.LogInformation(
                "Deleting client {ClientId} with {InvoiceCount} invoices and {PaymentCount} payments", 
                id, invoiceCount, paymentCount);

            // 1. Delete all invoice line items first
            if (invoiceIds.Any())
            {
                var lineItems = await _context.InvoiceLineItems
                    .Where(li => invoiceIds.Contains(li.InvoiceId))
                    .ToListAsync();
                
                if (lineItems.Any())
                {
                    _context.InvoiceLineItems.RemoveRange(lineItems);
                    _logger.LogInformation("Deleted {Count} invoice line items", lineItems.Count);
                }
            }

            // 2. Delete all payments
            var payments = await _context.Payments.Where(p => p.ClientId == id).ToListAsync();
            if (payments.Any())
            {
                _context.Payments.RemoveRange(payments);
                _logger.LogInformation("Deleted {Count} payments", payments.Count);
            }

            // 3. Delete all invoices
            var invoices = await _context.Invoices.Where(i => i.ClientId == id).ToListAsync();
            if (invoices.Any())
            {
                _context.Invoices.RemoveRange(invoices);
                _logger.LogInformation("Deleted {Count} invoices", invoices.Count);
            }

            // 4. Delete the client record
            _context.Clients.Remove(client);
            _logger.LogInformation("Deleted client {ClientId}", id);
            
            // Save all changes in the transaction
            await _context.SaveChangesAsync();
            
            // Commit the transaction
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Successfully deleted client {ClientId}, {InvoiceCount} invoices, and {PaymentCount} payments", 
                id, invoiceCount, paymentCount);

            return Ok(new { 
                message = "Client deleted successfully",
                deletedInvoices = invoiceCount,
                deletedPayments = paymentCount
            });
        }
        catch (Exception ex)
        {
            // Rollback the transaction on error
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to delete client {ClientId}", id);
            return StatusCode(500, new { message = "Failed to delete client", error = ex.Message });
        }
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

    /// <summary>
    /// POST /api/clients/{id}/calculate-mrr
    /// Calculate MRR from recent paid invoices (last 3 months average)
    /// </summary>
    [HttpPost("{id}/calculate-mrr")]
    public async Task<IActionResult> CalculateMrr(string id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        // Get paid invoices from the last 3 months
        var threeMonthsAgo = DateTime.UtcNow.AddMonths(-3);
        var recentInvoices = await _context.Invoices
            .Where(i => i.ClientId == id && 
                        i.Status == "paid" && 
                        i.PaidDate >= threeMonthsAgo)
            .ToListAsync();

        decimal calculatedMrr = 0;
        
        if (recentInvoices.Any())
        {
            // Calculate average monthly revenue from recent paid invoices
            var totalRevenue = recentInvoices.Sum(i => i.TotalAmount);
            var monthsSpan = Math.Max(1, (DateTime.UtcNow - threeMonthsAgo).Days / 30.0);
            calculatedMrr = totalRevenue / (decimal)monthsSpan;
        }

        return Ok(new
        {
            clientId = id,
            calculatedMrr = Math.Round(calculatedMrr, 2),
            invoiceCount = recentInvoices.Count,
            totalRevenue = recentInvoices.Sum(i => i.TotalAmount)
        });
    }

    /// <summary>
    /// PUT /api/clients/{id}/update-mrr-from-invoices
    /// Auto-update MRR based on recent invoices
    /// </summary>
    [HttpPut("{id}/update-mrr-from-invoices")]
    public async Task<IActionResult> UpdateMrrFromInvoices(string id)
    {
        var client = await _context.Clients
            .Include(c => c.Organisation)
            .FirstOrDefaultAsync(c => c.Id == id);
            
        if (client == null)
        {
            return NotFound(new { message = "Client not found" });
        }

        // Get paid invoices from the last 3 months
        var threeMonthsAgo = DateTime.UtcNow.AddMonths(-3);
        var recentInvoices = await _context.Invoices
            .Where(i => i.ClientId == id && 
                        i.Status == "paid" && 
                        i.PaidDate >= threeMonthsAgo)
            .ToListAsync();

        if (recentInvoices.Any())
        {
            var totalRevenue = recentInvoices.Sum(i => i.TotalAmount);
            var monthsSpan = Math.Max(1, (DateTime.UtcNow - threeMonthsAgo).Days / 30.0);
            client.Mrr = Math.Round(totalRevenue / (decimal)monthsSpan, 2);
            client.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Updated MRR for client {ClientId} to {Mrr}", id, client.Mrr);
        }

        // Get total invoice amount for this client
        var totalInvoices = await _context.Invoices
            .Where(i => i.ClientId == id)
            .SumAsync(i => i.TotalAmount);

        return Ok(MapToDto(client, totalInvoices));
    }

    private static object MapToDto(Client c, decimal totalInvoices) => new
    {
        id = c.Id,
        organisationId = c.OrganisationId,
        organisationName = c.Organisation?.Name,
        plan = c.Plan,
        status = c.Status,
        mrr = totalInvoices,
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
