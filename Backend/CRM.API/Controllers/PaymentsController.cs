using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(CrmDbContext context, ILogger<PaymentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clientId = null, [FromQuery] string? invoiceId = null)
    {
        var query = _context.Payments
            .Include(p => p.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(p => p.Invoice)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(clientId))
            query = query.Where(p => p.ClientId == clientId);

        if (!string.IsNullOrEmpty(invoiceId))
            query = query.Where(p => p.InvoiceId == invoiceId);

        var payments = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();

        return Ok(new { payments = payments.Select(MapToDto) });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var payment = await _context.Payments
            .Include(p => p.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        return Ok(MapToDto(payment));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var client = await _context.Clients.FindAsync(request.ClientId);
        if (client == null)
            return BadRequest(new { message = "Client not found" });

        if (!string.IsNullOrEmpty(request.InvoiceId))
        {
            var invoice = await _context.Invoices.FindAsync(request.InvoiceId);
            if (invoice == null)
                return BadRequest(new { message = "Invoice not found" });

            // Update invoice status if payment covers full amount
            if (request.Amount >= invoice.TotalAmount)
            {
                invoice.Status = "paid";
                invoice.PaidDate = request.PaymentDate ?? DateTime.UtcNow;
            }
        }

        var payment = new Payment
        {
            Id = $"payment:{Guid.NewGuid()}",
            ClientId = request.ClientId,
            InvoiceId = request.InvoiceId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod ?? "bank_transfer",
            PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
            Reference = request.Reference ?? "",
            Notes = request.Notes ?? "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        await _context.Entry(payment).Reference(p => p.Client).LoadAsync();
        if (payment.Client != null)
            await _context.Entry(payment.Client).Reference(c => c.Organisation).LoadAsync();
        if (!string.IsNullOrEmpty(payment.InvoiceId))
            await _context.Entry(payment).Reference(p => p.Invoice).LoadAsync();

        _logger.LogInformation("Created payment {PaymentId} for client {ClientId}", payment.Id, request.ClientId);

        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, MapToDto(payment));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePaymentRequest request)
    {
        var payment = await _context.Payments
            .Include(p => p.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        if (request.Amount.HasValue) payment.Amount = request.Amount.Value;
        if (request.PaymentMethod != null) payment.PaymentMethod = request.PaymentMethod;
        if (request.PaymentDate.HasValue) payment.PaymentDate = request.PaymentDate.Value;
        if (request.Reference != null) payment.Reference = request.Reference;
        if (request.Notes != null) payment.Notes = request.Notes;

        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(payment));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted payment {PaymentId}", id);

        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? clientId = null)
    {
        var query = _context.Payments.AsQueryable();
        if (!string.IsNullOrEmpty(clientId))
            query = query.Where(p => p.ClientId == clientId);

        var totalPayments = await query.CountAsync();
        var totalAmount = await query.SumAsync(p => p.Amount);

        return Ok(new
        {
            totalPayments,
            totalAmount
        });
    }

    private static object MapToDto(Payment p) => new
    {
        id = p.Id,
        clientId = p.ClientId,
        clientName = p.Client?.Organisation?.Name,
        invoiceId = p.InvoiceId,
        invoiceNumber = p.Invoice?.InvoiceNumber,
        amount = p.Amount,
        paymentMethod = p.PaymentMethod,
        paymentDate = p.PaymentDate,
        reference = p.Reference,
        notes = p.Notes,
        createdAt = p.CreatedAt,
        updatedAt = p.UpdatedAt
    };
}

public class CreatePaymentRequest
{
    public string ClientId { get; set; } = string.Empty;
    public string? InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePaymentRequest
{
    public decimal? Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
