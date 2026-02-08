using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(CrmDbContext context, ILogger<InvoicesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clientId = null, [FromQuery] string? status = null)
    {
        var query = _context.Invoices
            .Include(i => i.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(i => i.LineItems)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(clientId))
            query = query.Where(i => i.ClientId == clientId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();

        return Ok(new { invoices = invoices.Select(MapToDto) });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound(new { message = "Invoice not found" });

        return Ok(MapToDto(invoice));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var client = await _context.Clients.FindAsync(request.ClientId);
        if (client == null)
            return BadRequest(new { message = "Client not found" });

        // Calculate totals from line items if provided
        decimal amount = request.Amount;
        if (request.LineItems != null && request.LineItems.Any())
        {
            amount = request.LineItems.Sum(li => li.Quantity * li.UnitPrice);
        }

        var invoice = new Invoice
        {
            Id = $"invoice:{Guid.NewGuid()}",
            ClientId = request.ClientId,
            InvoiceNumber = request.InvoiceNumber,
            Description = request.Description ?? "",
            Amount = amount,
            Tax = request.Tax ?? 0,
            TotalAmount = amount + (request.Tax ?? 0),
            Status = request.Status ?? "draft",
            IssueDate = request.IssueDate ?? DateTime.UtcNow,
            DueDate = request.DueDate,
            Notes = request.Notes ?? "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Invoices.Add(invoice);

        // Add line items
        if (request.LineItems != null && request.LineItems.Any())
        {
            var sortOrder = 0;
            foreach (var lineItem in request.LineItems)
            {
                var item = new InvoiceLineItem
                {
                    Id = $"line:{Guid.NewGuid()}",
                    InvoiceId = invoice.Id,
                    Description = lineItem.Description,
                    Quantity = lineItem.Quantity,
                    UnitPrice = lineItem.UnitPrice,
                    Total = lineItem.Quantity * lineItem.UnitPrice,
                    SortOrder = sortOrder++,
                    CreatedAt = DateTime.UtcNow
                };
                _context.InvoiceLineItems.Add(item);
            }
        }

        await _context.SaveChangesAsync();

        await _context.Entry(invoice).Reference(i => i.Client).LoadAsync();
        if (invoice.Client != null)
            await _context.Entry(invoice.Client).Reference(c => c.Organisation).LoadAsync();
        await _context.Entry(invoice).Collection(i => i.LineItems).LoadAsync();

        _logger.LogInformation("Created invoice {InvoiceId} for client {ClientId}", invoice.Id, request.ClientId);

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, MapToDto(invoice));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateInvoiceRequest request)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound(new { message = "Invoice not found" });

        if (request.InvoiceNumber != null) invoice.InvoiceNumber = request.InvoiceNumber;
        if (request.Description != null) invoice.Description = request.Description;
        
        // Update line items if provided
        if (request.LineItems != null)
        {
            // Remove existing line items
            _context.InvoiceLineItems.RemoveRange(invoice.LineItems);
            
            // Add new line items
            var sortOrder = 0;
            foreach (var lineItem in request.LineItems)
            {
                var item = new InvoiceLineItem
                {
                    Id = $"line:{Guid.NewGuid()}",
                    InvoiceId = invoice.Id,
                    Description = lineItem.Description,
                    Quantity = lineItem.Quantity,
                    UnitPrice = lineItem.UnitPrice,
                    Total = lineItem.Quantity * lineItem.UnitPrice,
                    SortOrder = sortOrder++,
                    CreatedAt = DateTime.UtcNow
                };
                _context.InvoiceLineItems.Add(item);
            }
            
            // Recalculate amount from line items
            invoice.Amount = request.LineItems.Sum(li => li.Quantity * li.UnitPrice);
        }
        else if (request.Amount.HasValue)
        {
            invoice.Amount = request.Amount.Value;
        }
        
        if (request.Tax.HasValue) invoice.Tax = request.Tax.Value;
        if (request.Amount.HasValue || request.Tax.HasValue || request.LineItems != null)
            invoice.TotalAmount = invoice.Amount + invoice.Tax;
        if (request.Status != null)
        {
            invoice.Status = request.Status;
            if (request.Status == "paid" && !invoice.PaidDate.HasValue)
                invoice.PaidDate = DateTime.UtcNow;
        }
        if (request.IssueDate.HasValue) invoice.IssueDate = request.IssueDate.Value;
        if (request.DueDate.HasValue) invoice.DueDate = request.DueDate;
        if (request.PaidDate.HasValue) invoice.PaidDate = request.PaidDate;
        if (request.Notes != null) invoice.Notes = request.Notes;

        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(invoice));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound(new { message = "Invoice not found" });

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted invoice {InvoiceId}", id);

        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? clientId = null)
    {
        var query = _context.Invoices.AsQueryable();
        if (!string.IsNullOrEmpty(clientId))
            query = query.Where(i => i.ClientId == clientId);

        var totalInvoices = await query.CountAsync();
        var totalAmount = await query.SumAsync(i => i.TotalAmount);
        var paidAmount = await query.Where(i => i.Status == "paid").SumAsync(i => i.TotalAmount);
        var overdueAmount = await query.Where(i => i.Status == "overdue").SumAsync(i => i.TotalAmount);
        var unpaidAmount = totalAmount - paidAmount;

        return Ok(new
        {
            totalInvoices,
            totalAmount,
            paidAmount,
            unpaidAmount,
            overdueAmount
        });
    }

    private static object MapToDto(Invoice i) => new
    {
        id = i.Id,
        clientId = i.ClientId,
        clientName = i.Client?.Organisation?.Name,
        invoiceNumber = i.InvoiceNumber,
        description = i.Description,
        amount = i.Amount,
        tax = i.Tax,
        totalAmount = i.TotalAmount,
        status = i.Status,
        issueDate = i.IssueDate,
        dueDate = i.DueDate,
        paidDate = i.PaidDate,
        notes = i.Notes,
        lineItems = i.LineItems?.OrderBy(li => li.SortOrder).Select(li => new
        {
            id = li.Id,
            description = li.Description,
            quantity = li.Quantity,
            unitPrice = li.UnitPrice,
            total = li.Total
        }).ToList(),
        createdAt = i.CreatedAt,
        updatedAt = i.UpdatedAt
    };
}

public class CreateInvoiceRequest
{
    public string ClientId { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public decimal? Tax { get; set; }
    public string? Status { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceLineItemRequest>? LineItems { get; set; }
}

public class UpdateInvoiceRequest
{
    public string? InvoiceNumber { get; set; }
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public decimal? Tax { get; set; }
    public string? Status { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceLineItemRequest>? LineItems { get; set; }
}

public class InvoiceLineItemRequest
{
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
}
