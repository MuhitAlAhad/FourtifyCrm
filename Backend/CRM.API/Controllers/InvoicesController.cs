using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;
using CRM.API.Services;
using PuppeteerSharp;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<InvoicesController> _logger;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private static string? _cachedLogoUrl = null;

    public InvoicesController(
        CrmDbContext context, 
        ILogger<InvoicesController> logger, 
        IEmailService emailService,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clientId = null, [FromQuery] string? status = null)
    {
        _logger.LogInformation("GetAll Invoices - ClientId: {ClientId}, Status: {Status}", clientId ?? "ALL", status ?? "ALL");
        
        var query = _context.Invoices
            .Include(i => i.Client)
            .ThenInclude(c => c!.Organisation)
            .Include(i => i.LineItems)
            .AsNoTracking();

        if (!string.IsNullOrEmpty(clientId))
        {
            query = query.Where(i => i.ClientId == clientId);
            _logger.LogInformation("Filtering invoices by ClientId: {ClientId}", clientId);
        }

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        
        _logger.LogInformation("Found {Count} invoices. ClientIds: {ClientIds}", 
            invoices.Count, 
            string.Join(", ", invoices.Select(i => $"{i.InvoiceNumber}:{i.ClientId}")));

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
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            _logger.LogWarning("Invalid invoice creation request: {Errors}", string.Join(", ", errors));
            return BadRequest(new { message = "Invalid request", errors });
        }
        
        _logger.LogInformation("Creating invoice - ClientId: {ClientId}, InvoiceNumber: {InvoiceNumber}, Amount: {Amount}", 
            request.ClientId, request.InvoiceNumber, request.Amount);
        
        var client = await _context.Clients.FindAsync(request.ClientId);
        if (client == null)
        {
            _logger.LogWarning("Client not found: {ClientId}", request.ClientId);
            return BadRequest(new { message = "Client not found" });
        }

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

    [HttpPost("{id}/send")]
    public async Task<IActionResult> SendInvoice(string id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Client)
                .ThenInclude(c => c!.Organisation)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound(new { message = "Invoice not found" });

        // Get primary contact for the client's organisation
        var primaryContact = await _context.Contacts
            .Where(c => c.OrganisationId == invoice.Client!.OrganisationId && c.IsPrimary)
            .FirstOrDefaultAsync();

        if (primaryContact == null)
        {
            primaryContact = await _context.Contacts
                .Where(c => c.OrganisationId == invoice.Client!.OrganisationId)
                .FirstOrDefaultAsync();
        }

        if (primaryContact == null || string.IsNullOrEmpty(primaryContact.Email))
        {
            return BadRequest(new { message = "No contact email found for this client" });
        }

        // Generate invoice HTML for email (dark theme)
        var invoiceHtml = GenerateInvoiceHtml(invoice, primaryContact);
        
        // Try to get hosted logo URL for email
        var hostedLogoUrl = await GetOrUploadLogoUrlAsync();
        var emailHtml = await GenerateInvoiceEmailHtmlAsync(invoice, primaryContact, invoiceHtml, hostedLogoUrl);

        // Generate PDF-specific HTML (white background, black text)
        var pdfHtml = GenerateInvoicePdfHtml(invoice, primaryContact);

        // Generate PDF from invoice HTML
        byte[] pdfBytes;
        try
        {
            pdfBytes = await GenerateInvoicePdfAsync(pdfHtml);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PDF for invoice {InvoiceId}", id);
            return StatusCode(500, new { success = false, message = "Failed to generate invoice PDF" });
        }

        // Send email with PDF attachment
        var emailRequest = new SendEmailRequest
        {
            ToEmail = primaryContact.Email,
            ToName = $"{primaryContact.FirstName} {primaryContact.LastName}",
            Subject = $"Invoice {invoice.InvoiceNumber} from Fourtify Defence",
            Body = $"Please find attached your invoice #{invoice.InvoiceNumber} for ${invoice.TotalAmount:F2}",
            HtmlBody = emailHtml,
            ContactId = primaryContact.Id,
            OrganisationId = invoice.Client.OrganisationId,
            SentBy = "System",
            Attachments = new List<EmailAttachment>
            {
                new EmailAttachment
                {
                    FileName = $"Invoice-{invoice.InvoiceNumber}.pdf",
                    Content = pdfBytes,
                    ContentType = "application/pdf"
                }
            }
        };

        try
        {
            var result = await _emailService.SendEmailAsync(emailRequest);
            
            if (result.Status == "failed")
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to send invoice email", 
                    error = result.ErrorMessage
                });
            }

            // Update invoice status to 'sent' if it was 'draft'
            if (invoice.Status == "draft")
            {
                invoice.Status = "sent";
                invoice.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { 
                success = true, 
                message = "Invoice sent successfully",
                sentTo = primaryContact.Email
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invoice email");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    private async Task<string?> GetOrUploadLogoUrlAsync()
    {
        // Return cached URL if available
        if (!string.IsNullOrEmpty(_cachedLogoUrl))
        {
            return _cachedLogoUrl;
        }

        try
        {
            // Try to use logo from Supabase storage first (if already uploaded)
            var supabaseUrl = _configuration["Supabase:Url"];
            var supabaseKey = _configuration["Supabase:ApiKey"];
            
            if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(supabaseKey))
            {
                var logoUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/signatures/company-logo.png";
                
                // Check if logo exists in Supabase
                try
                {
                    using var client = _httpClientFactory.CreateClient();
                    var checkResponse = await client.GetAsync(logoUrl);
                    
                    if (checkResponse.IsSuccessStatusCode)
                    {
                        _cachedLogoUrl = logoUrl;
                        _logger.LogInformation("Using logo from Supabase: {Url}", logoUrl);
                        return _cachedLogoUrl;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to check Supabase logo availability");
                }
            }
            
            // Try to find logo file locally (for development/uploading)
            var projectDir = Directory.GetCurrentDirectory();
            DirectoryInfo? currentDir = new DirectoryInfo(projectDir);
            string? workspaceRoot = null;
            
            while (currentDir != null && workspaceRoot == null)
            {
                if (currentDir.GetFiles("*.sln").Any())
                {
                    workspaceRoot = currentDir.FullName;
                    break;
                }
                currentDir = currentDir.Parent;
            }
            
            if (workspaceRoot == null)
            {
                _logger.LogWarning("Could not find workspace root (no .sln file found), logo will not be available");
                return null;
            }
            
            var logoPath = Path.Combine(workspaceRoot, "src", "assets", "35f931b802bf39733103d00f96fb6f9c21293f6e.png");
            
            if (!System.IO.File.Exists(logoPath))
            {
                _logger.LogWarning("Logo file not found at: {LogoPath}, logo will not be available", logoPath);
                return null;
            }

            var logoBytes = await System.IO.File.ReadAllBytesAsync(logoPath);
            
            // Upload to Supabase storage
            var supabaseUrl = _configuration["Supabase:Url"];
            var supabaseKey = _configuration["Supabase:ApiKey"];

            if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(supabaseKey))
            {
                try
                {
                    var fileName = "company-logo.png";
                    var bucket = "signatures";
                    
                    using var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseKey}");
                    client.DefaultRequestHeaders.Add("apikey", supabaseKey);

                    using var content = new ByteArrayContent(logoBytes);
                    content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");

                    // First, try to access the existing file
                    var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucket}/{fileName}";
                    var checkResponse = await client.GetAsync(uploadUrl);
                    
                    if (checkResponse.IsSuccessStatusCode)
                    {
                        // File already exists, return the URL
                        _cachedLogoUrl = uploadUrl;
                        _logger.LogInformation("Logo already exists in Supabase: {Url}", uploadUrl);
                        return _cachedLogoUrl;
                    }
                    
                    // File doesn't exist, try to upload
                    var response = await client.PostAsync($"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucket}/{fileName}", content);
                    
                    if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.Conflict)
                    {
                        // Success or file already exists
                        _cachedLogoUrl = uploadUrl;
                        _logger.LogInformation("Logo uploaded to Supabase: {Url}", uploadUrl);
                        return _cachedLogoUrl;
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning("Failed to upload logo to Supabase: {Status}, Response: {Response}", response.StatusCode, errorContent);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error uploading logo to Supabase, will use base64 fallback");
                }
            }

            // If Supabase upload fails, return null (will use base64 fallback)
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing logo for email");
            return null;
        }
    }

    private string GetLogoBase64()
    {
        try
        {
            // Navigate from CRM.API project to workspace root by finding the .sln file
            var projectDir = Directory.GetCurrentDirectory();
            
            // Find workspace root by looking for .sln file
            DirectoryInfo? currentDir = new DirectoryInfo(projectDir);
            string? workspaceRoot = null;
            
            while (currentDir != null && workspaceRoot == null)
            {
                if (currentDir.GetFiles("*.sln").Any())
                {
                    workspaceRoot = currentDir.FullName;
                    break;
                }
                currentDir = currentDir.Parent;
            }
            
            if (workspaceRoot == null)
            {
                _logger.LogWarning("Could not find workspace root (no .sln file found)");
                return string.Empty;
            }
            
            var logoPath = Path.Combine(workspaceRoot, "src", "assets", "35f931b802bf39733103d00f96fb6f9c21293f6e.png");
            
            _logger.LogInformation("Current dir: {CurrentDir}", projectDir);
            _logger.LogInformation("Workspace root: {WorkspaceRoot}", workspaceRoot);
            _logger.LogInformation("Looking for logo at: {LogoPath}", logoPath);
            
            if (System.IO.File.Exists(logoPath))
            {
                var imageBytes = System.IO.File.ReadAllBytes(logoPath);
                _logger.LogInformation("Logo loaded successfully, size: {Size} bytes", imageBytes.Length);
                return Convert.ToBase64String(imageBytes);
            }
            
            _logger.LogWarning("Logo file not found at: {LogoPath}", logoPath);
            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading logo file");
            return string.Empty;
        }
    }

    private async Task<byte[]> GenerateInvoicePdfAsync(string html)
    {
        try
        {
            // Download Chromium browser if not already downloaded
            var browserFetcher = new BrowserFetcher();
            
            _logger.LogInformation("Checking for Chromium installation...");
            await browserFetcher.DownloadAsync();
            _logger.LogInformation("Chromium ready");

            // Launch browser and create PDF
            await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage" }
            });

            await using var page = await browser.NewPageAsync();
            await page.SetContentAsync(html);

            // Generate PDF with proper formatting
            var pdfData = await page.PdfDataAsync(new PdfOptions
            {
                Format = PuppeteerSharp.Media.PaperFormat.A4,
                PrintBackground = true
            });

            _logger.LogInformation("PDF generated successfully, size: {Size} bytes", pdfData.Length);
            return pdfData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PDF using PuppeteerSharp");
            throw; // Re-throw to be handled by caller
        }
    }

    private string GenerateInvoiceHtml(Invoice invoice, Contact contact)
    {
        var lineItemsHtml = string.Join("", invoice.LineItems?.OrderBy(li => li.SortOrder).Select((li, index) => 
            $@"<tr style='border-bottom: 1px solid #1e293b;'>
                <td style='padding: 12px 16px; color: #f8fafc; font-size: 14px;'>{index + 1}</td>
                <td style='padding: 12px 16px; color: #f8fafc; font-size: 14px;'>{li.Description}</td>
                <td style='padding: 12px 16px; color: #10b981; font-size: 14px; text-align: right; font-weight: 600;'>${li.Total:F2}</td>
            </tr>") ?? Enumerable.Empty<string>());

        var taxPercentage = invoice.Amount > 0 ? (invoice.Tax / invoice.Amount * 100) : 0;

        return $@"
        <div style='background-color: #0f172a; padding: 32px; border-radius: 8px; max-width: 800px; margin: 20px auto; font-family: system-ui, -apple-system, sans-serif;'>
            <div style='display: flex; justify-content: space-between; align-items: start; padding-bottom: 24px; border-bottom: 1px solid #1e293b; margin-bottom: 24px;'>
                <div style='padding: 8px;'>
                    <div style='width: 160px; height: auto;'>
                        <div style='background-color: #1e293b; padding: 16px; border-radius: 8px; color: #10b981; font-size: 18px; font-weight: bold;'>4D LOGO</div>
                    </div>
                </div>
                <div style='text-align: right;'>
                    <h1 style='color: #f8fafc; font-size: 36px; margin: 0; font-weight: bold;'>INVOICE</h1>
                </div>
            </div>

            <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px;'>
                <div>
                    <div style='margin-bottom: 12px;'>
                        <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>INVOICE #</div>
                        <div style='color: #f8fafc; font-size: 14px;'>{invoice.InvoiceNumber}</div>
                    </div>
                    <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 12px;'>
                        <div>
                            <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>INVOICE DATE</div>
                            <div style='color: #f8fafc; font-size: 14px;'>{invoice.IssueDate:dd/MM/yyyy}</div>
                        </div>
                        <div>
                            <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>DUE DATE</div>
                            <div style='color: #f8fafc; font-size: 14px;'>{(invoice.DueDate.HasValue ? invoice.DueDate.Value.ToString("dd/MM/yyyy") : "N/A")}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>BILL TO</div>
                    <div style='color: #f8fafc; font-size: 14px; white-space: pre-line;'>{invoice.Description}</div>
                    <div style='margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;'>
                        <div style='color: #94a3b8; font-size: 11px; margin-bottom: 4px;'>EMAIL</div>
                        <div style='color: #10b981; font-size: 14px;'>{contact.Email}</div>
                    </div>
                </div>
            </div>

            <div style='margin-bottom: 24px;'>
                <table style='width: 100%; border-collapse: collapse; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;'>
                    <thead>
                        <tr style='background-color: #1e293b;'>
                            <th style='padding: 12px 16px; color: #94a3b8; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase;'>SL</th>
                            <th style='padding: 12px 16px; color: #94a3b8; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase;'>Description</th>
                            <th style='padding: 12px 16px; color: #94a3b8; font-size: 11px; font-weight: 600; text-align: right; text-transform: uppercase;'>Price</th>
                        </tr>
                    </thead>
                    <tbody style='background-color: #0f172a;'>
                        {lineItemsHtml}
                        <tr style='background-color: #1e293b; font-weight: 600;'>
                            <td style='padding: 12px 16px;'></td>
                            <td style='padding: 12px 16px; color: #f8fafc; font-size: 14px; text-transform: uppercase;'>Subtotal</td>
                            <td style='padding: 12px 16px; color: #10b981; font-size: 16px; text-align: right;'>${invoice.Amount:F2}</td>
                        </tr>
                        <tr style='background-color: #1e293b;'>
                            <td style='padding: 12px 16px;'></td>
                            <td style='padding: 12px 16px;'>
                                <span style='color: #f8fafc; font-size: 14px; text-transform: uppercase;'>Tax ({taxPercentage:F0}%)</span>
                            </td>
                            <td style='padding: 12px 16px; color: #f8fafc; font-size: 16px; text-align: right;'>${invoice.Tax:F2}</td>
                        </tr>
                        <tr style='background-color: #0f172a; border-top: 2px solid #10b981;'>
                            <td style='padding: 16px;'></td>
                            <td style='padding: 16px; color: #f8fafc; font-size: 16px; font-weight: bold; text-transform: uppercase;'>Total</td>
                            <td style='padding: 16px; color: #10b981; font-size: 20px; font-weight: bold; text-align: right;'>${invoice.TotalAmount:F2}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 24px; border-top: 1px solid #1e293b; margin-bottom: 24px;'>
                <div>
                    <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>PAYMENT METHOD</div>
                    <div style='color: #cbd5e1; font-size: 12px; white-space: pre-line;'>{invoice.Notes}</div>
                </div>
                <div>
                    <div style='color: #94a3b8; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>TERM AND CONDITIONS</div>
                    <div style='color: #cbd5e1; font-size: 12px; line-height: 1.5;'>Please make the payment by the due date to the account below. We accept bank transfer, credit card, or check.</div>
                </div>
            </div>

            <div style='text-align: center; padding-top: 16px; border-top: 1px solid #1e293b;'>
                <div style='color: #f8fafc; font-size: 14px; font-weight: 600; margin-bottom: 8px;'>THANK YOU FOR YOUR BUSINESS</div>
                <div style='background-color: #1e293b; border: 1px solid #10b981; padding: 12px 16px; border-radius: 8px; display: inline-block;'>
                    <div style='color: #10b981; font-size: 12px;'>admin@fourd.com.au</div>
                </div>
            </div>
        </div>";
    }

    private string GenerateInvoicePdfHtml(Invoice invoice, Contact contact)
    {
        var lineItemsHtml = string.Join("", invoice.LineItems?.OrderBy(li => li.SortOrder).Select((li, index) => 
            $@"<tr style='border-bottom: 1px solid #e2e8f0;'>
                <td style='padding: 12px 16px; color: #1e293b; font-size: 14px;'>{index + 1}</td>
                <td style='padding: 12px 16px; color: #1e293b; font-size: 14px;'>{li.Description}</td>
                <td style='padding: 12px 16px; color: #059669; font-size: 14px; text-align: right; font-weight: 600;'>${li.Total:F2}</td>
            </tr>") ?? Enumerable.Empty<string>());

        var taxPercentage = invoice.Amount > 0 ? (invoice.Tax / invoice.Amount * 100) : 0;
        var logoBase64 = GetLogoBase64();
        var logoHtml = !string.IsNullOrEmpty(logoBase64) 
            ? $"<img src='data:image/png;base64,{logoBase64}' style='max-width: 160px; height: auto;' alt='Company Logo' />"
            : "<div style='background-color: #f1f5f9; padding: 16px; border-radius: 8px; color: #059669; font-size: 18px; font-weight: bold; border: 2px solid #e2e8f0;'>4D LOGO</div>";

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body {{ margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }}
            </style>
        </head>
        <body>
        <div style='background-color: #ffffff; padding: 32px; max-width: 800px; margin: 0 auto;'>
            <div style='display: flex; justify-content: space-between; align-items: start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px;'>
                <div style='padding: 8px;'>
                    <div style='width: 160px; height: auto;'>
                        {logoHtml}
                    </div>
                </div>
                <div style='text-align: right;'>
                    <h1 style='color: #1e293b; font-size: 36px; margin: 0; font-weight: bold;'>INVOICE</h1>
                </div>
            </div>

            <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px;'>
                <div>
                    <div style='margin-bottom: 12px;'>
                        <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>INVOICE #</div>
                        <div style='color: #1e293b; font-size: 14px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>{invoice.InvoiceNumber}</div>
                    </div>
                    <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 12px;'>
                        <div>
                            <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>INVOICE DATE</div>
                            <div style='color: #1e293b; font-size: 14px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>{invoice.IssueDate:dd/MM/yyyy}</div>
                        </div>
                        <div>
                            <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 4px;'>DUE DATE</div>
                            <div style='color: #1e293b; font-size: 14px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>{(invoice.DueDate.HasValue ? invoice.DueDate.Value.ToString("dd/MM/yyyy") : "N/A")}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>BILL TO</div>
                    <div style='color: #1e293b; font-size: 14px; white-space: pre-line; padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>{invoice.Description}</div>
                    <div style='margin-top: 8px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f0fdf4;'>
                        <div style='color: #64748b; font-size: 11px; margin-bottom: 4px;'>EMAIL</div>
                        <div style='color: #059669; font-size: 14px; font-weight: 500;'>{contact.Email}</div>
                    </div>
                </div>
            </div>

            <div style='margin-bottom: 24px;'>
                <table style='width: 100%; border-collapse: collapse; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden;'>
                    <thead>
                        <tr style='background-color: #f1f5f9;'>
                            <th style='padding: 12px 16px; color: #475569; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;'>SL</th>
                            <th style='padding: 12px 16px; color: #475569; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;'>Description</th>
                            <th style='padding: 12px 16px; color: #475569; font-size: 11px; font-weight: 600; text-align: right; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;'>Price</th>
                        </tr>
                    </thead>
                    <tbody style='background-color: #ffffff;'>
                        {lineItemsHtml}
                        <tr style='background-color: #f8fafc; font-weight: 600;'>
                            <td style='padding: 12px 16px; border-top: 2px solid #e2e8f0;'></td>
                            <td style='padding: 12px 16px; color: #1e293b; font-size: 14px; text-transform: uppercase; border-top: 2px solid #e2e8f0;'>Subtotal</td>
                            <td style='padding: 12px 16px; color: #059669; font-size: 16px; text-align: right; border-top: 2px solid #e2e8f0;'>${invoice.Amount:F2}</td>
                        </tr>
                        <tr style='background-color: #f8fafc;'>
                            <td style='padding: 12px 16px;'></td>
                            <td style='padding: 12px 16px;'>
                                <span style='color: #1e293b; font-size: 14px; text-transform: uppercase;'>Tax ({taxPercentage:F0}%)</span>
                            </td>
                            <td style='padding: 12px 16px; color: #1e293b; font-size: 16px; text-align: right;'>${invoice.Tax:F2}</td>
                        </tr>
                        <tr style='background-color: #ecfdf5; border-top: 2px solid #059669;'>
                            <td style='padding: 16px;'></td>
                            <td style='padding: 16px; color: #1e293b; font-size: 16px; font-weight: bold; text-transform: uppercase;'>Total</td>
                            <td style='padding: 16px; color: #059669; font-size: 20px; font-weight: bold; text-align: right;'>${invoice.TotalAmount:F2}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 24px; border-top: 2px solid #e2e8f0; margin-bottom: 24px;'>
                <div>
                    <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>PAYMENT METHOD</div>
                    <div style='color: #475569; font-size: 12px; white-space: pre-line; padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>{invoice.Notes}</div>
                </div>
                <div>
                    <div style='color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 8px;'>TERM AND CONDITIONS</div>
                    <div style='color: #475569; font-size: 12px; line-height: 1.5; padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc;'>Please make the payment by the due date to the account below. We accept bank transfer, credit card, or check.</div>
                </div>
            </div>

            <div style='text-align: center; padding-top: 16px; border-top: 2px solid #e2e8f0;'>
                <div style='color: #1e293b; font-size: 14px; font-weight: 600; margin-bottom: 8px;'>THANK YOU FOR YOUR BUSINESS</div>
                <div style='background-color: #f0fdf4; border: 2px solid #059669; padding: 12px 16px; border-radius: 8px; display: inline-block;'>
                    <div style='color: #059669; font-size: 12px; font-weight: 500;'>admin@fourd.com.au</div>
                </div>
            </div>
        </div>
        </body>
        </html>";
    }

    private async Task<string> GenerateInvoiceEmailHtmlAsync(Invoice invoice, Contact contact, string invoiceHtml, string? hostedLogoUrl = null)
    {
        var dateRange = invoice.DueDate.HasValue 
            ? $"{invoice.IssueDate:MMMM dd, yyyy} to {invoice.DueDate.Value:MMMM dd, yyyy}"
            : $"{invoice.IssueDate:MMMM dd, yyyy}";

        // Use hosted logo URL if available, otherwise fallback to base64
        string logoHeaderHtml;
        if (!string.IsNullOrEmpty(hostedLogoUrl))
        {
            logoHeaderHtml = $"<img src='{hostedLogoUrl}' style='max-width: 200px; height: auto; margin-bottom: 12px;' alt='Fourtify Defence Logo' />";
            _logger.LogInformation("Using hosted logo URL in email: {Url}", hostedLogoUrl);
        }
        else
        {
            var logoBase64 = GetLogoBase64();
            if (!string.IsNullOrEmpty(logoBase64))
            {
                logoHeaderHtml = $"<img src='data:image/png;base64,{logoBase64}' style='max-width: 200px; height: auto; margin-bottom: 12px;' alt='Fourtify Defence Logo' />";
                _logger.LogInformation("Using base64 logo in email (fallback)");
            }
            else
            {
                logoHeaderHtml = "<h1 style='color: white; margin: 0; font-size: 32px; font-weight: bold;'>Fourtify Defence</h1>";
                _logger.LogWarning("No logo available, using text fallback");
            }
        }

        return await Task.FromResult($@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f1f5f9;'>
        <tr>
            <td align='center' style='padding: 40px 20px;'>
                <table width='600' cellpadding='0' cellspacing='0' style='background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center;'>
                            {logoHeaderHtml}
                            <p style='color: #cbd5e1; margin: 8px 0 0 0; font-size: 16px;'>Invoice Ready</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px 30px;'>
                            <p style='color: #1e293b; font-size: 18px; margin: 0 0 16px 0;'>Dear {contact.FirstName},</p>
                            
                            <p style='color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;'>
                                Please find attached your invoice for the period <strong style='color: #1e293b;'>{dateRange}</strong>.
                            </p>
                            
                            <p style='color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;'>
                                The complete invoice details are provided in the attached PDF document.
                            </p>
                            
                            <p style='color: #475569; font-size: 13px; line-height: 1.5; margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-left: 3px solid #10b981; border-radius: 4px;'>
                                <strong style='color: #1e293b;'>Note:</strong> Please review the attached PDF for full invoice details and payment information.
                            </p>
                            
                            <p style='color: #475569; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;'>
                                We appreciate your business with Fourtify Defence and look forward to continuing our partnership with your organisation.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style='padding: 0 30px;'>
                            <div style='border-top: 2px solid #10b981; margin: 20px 0;'></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='padding: 30px; text-align: center;'>
                            <p style='color: #64748b; font-size: 14px; margin: 0 0 8px 0;'>If you have any questions, please don't hesitate to contact us.</p>
                            <p style='color: #1e293b; font-size: 14px; margin: 16px 0 4px 0;'>Kind regards,</p>
                            <p style='color: #1e293b; font-size: 14px; font-weight: 600; margin: 0;'>The Fourtify Defence Team</p>
                            <p style='color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;'>
                                <a href='mailto:admin@fourd.com.au' style='color: #10b981; text-decoration: none;'>admin@fourd.com.au</a>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Email Footer -->
                <table width='600' cellpadding='0' cellspacing='0' style='margin-top: 20px;'>
                    <tr>
                        <td style='text-align: center; padding: 20px;'>
                            <p style='color: #94a3b8; font-size: 12px; margin: 0;'>
                                © 2026 Fourtify Defence. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>\");
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
