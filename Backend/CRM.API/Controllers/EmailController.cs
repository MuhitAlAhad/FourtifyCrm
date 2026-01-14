using Microsoft.AspNetCore.Mvc;
using CRM.API.Services;
using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ISesEmailService _sesEmailService;
    private readonly CrmDbContext _context;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, ISesEmailService sesEmailService, CrmDbContext context, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _sesEmailService = sesEmailService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Send an email
    /// POST /api/email/send
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.ToEmail) || string.IsNullOrEmpty(request.Subject))
        {
            return BadRequest("ToEmail and Subject are required");
        }

        try
        {
            var result = await _emailService.SendEmailAsync(request);
            
            if (result.Status == "failed")
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to send email", 
                    error = result.ErrorMessage,
                    email = result
                });
            }

            return Ok(new { 
                success = true, 
                message = "Email sent successfully",
                email = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Bulk send emails to multiple contacts
    /// POST /api/email/bulk-send
    /// </summary>
    [HttpPost("bulk-send")]
    public async Task<IActionResult> BulkSend([FromBody] BulkSendRequest request)
    {
        if (request.ContactIds == null || !request.ContactIds.Any())
        {
            return BadRequest("ContactIds are required");
        }

        // Create campaign if name provided
        EmailCampaign? campaign = null;
        if (!string.IsNullOrEmpty(request.CampaignName))
        {
            campaign = new EmailCampaign
            {
                Name = request.CampaignName,
                Subject = request.Subject,
                Body = request.Body,
                HtmlBody = request.HtmlBody ?? string.Empty,
                TemplateId = request.TemplateId,
                TotalRecipients = request.ContactIds.Count,
                Status = "sending",
                CreatedBy = request.SentBy ?? "CRM User",
                CreatedAt = DateTime.UtcNow
            };
            _context.EmailCampaigns.Add(campaign);
            await _context.SaveChangesAsync();
        }

        // Get contacts
        var contacts = await _context.Contacts
            .Where(c => request.ContactIds.Contains(c.Id) && !string.IsNullOrEmpty(c.Email))
            .ToListAsync();

        var sendEmailRequestList = new List<SendEmailRequest>();
        int sentCount = 0, failedCount = 0;
        string sesSubject = string.Empty;
        string sesBody = string.Empty;
        List<string> sesEmailList = new List<string>();

        foreach (var contact in contacts)
        {
            // Apply template variables
            var subject = SubstituteVariables(request.Subject, contact);
            var body = SubstituteVariables(request.Body, contact);
            var htmlBody = SubstituteVariables(request.HtmlBody ?? string.Empty, contact);
            sesSubject = SubstituteVariables(request.Subject, contact);
            sesBody = SubstituteVariables(request.Body, contact);
            contact.Email = "devfourd@gmail.com";
            sesEmailList.Add(contact.Email);

            var emailRequest = new SendEmailRequest
            {
                ToEmail = contact.Email,
                ToName = $"{contact.FirstName} {contact.LastName}",
                Subject = subject,
                Body = body,
                HtmlBody = htmlBody,
                ContactId = contact.Id,
                OrganisationId = contact.OrganisationId,
                CampaignId = campaign?.Id,
                SentBy = request.SentBy ?? "CRM User"
            };

            sendEmailRequestList.Add(emailRequest);

            //var result = await _emailService.SendEmailAsync(emailRequest);

        }

        //var resultList = await _emailService.SendBulkEmailAsync(sendEmailRequestList);

        var sesEmailSentResult = await _sesEmailService.SendBulkEmailAsync(
            sesEmailList,
            sesSubject,
            sesBody);

        sentCount = sesEmailSentResult.Where(r => r.Success).Select(r => r.Email).ToList().Count;
        failedCount = sesEmailSentResult.Where(r => !r.Success).Select(r => r.Email).ToList().Count;

        // Update campaign stats
        if (campaign != null)
        {
            campaign.SentCount = sentCount;
            campaign.FailedCount = failedCount;
            campaign.Status = "sent";
            campaign.SentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(new {
            success = true,
            message = $"Sent {sentCount} emails, {failedCount} failed",
            totalContacts = contacts.Count,
            sentCount,
            failedCount,
            campaignId = campaign?.Id,
            sesEmailList
            //resultList
        });
    }

    /// <summary>
    /// Get all campaigns
    /// GET /api/email/campaigns
    /// </summary>
    [HttpGet("campaigns")]
    public async Task<IActionResult> GetCampaigns()
    {
        var campaigns = await _context.EmailCampaigns
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new {
                c.Id,
                c.Name,
                c.Subject,
                c.Status,
                c.TotalRecipients,
                c.SentCount,
                c.OpenedCount,
                c.ClickedCount,
                c.BouncedCount,
                c.FailedCount,
                OpenRate = c.SentCount > 0 ? Math.Round((double)c.OpenedCount / c.SentCount * 100, 1) : 0,
                ClickRate = c.SentCount > 0 ? Math.Round((double)c.ClickedCount / c.SentCount * 100, 1) : 0,
                c.CreatedAt,
                c.SentAt
            })
            .ToListAsync();

        return Ok(new { campaigns });
    }

    /// <summary>
    /// Get campaign details
    /// GET /api/email/campaigns/{id}
    /// </summary>
    [HttpGet("campaigns/{id}")]
    public async Task<IActionResult> GetCampaign(string id)
    {
        var campaign = await _context.EmailCampaigns
            .Include(c => c.Emails)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (campaign == null) return NotFound();

        return Ok(new {
            campaign,
            openRate = campaign.SentCount > 0 ? Math.Round((double)campaign.OpenedCount / campaign.SentCount * 100, 1) : 0,
            clickRate = campaign.SentCount > 0 ? Math.Round((double)campaign.ClickedCount / campaign.SentCount * 100, 1) : 0
        });
    }

    /// <summary>
    /// Resend webhook for tracking opens/clicks/bounces
    /// POST /api/email/webhook
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] ResendWebhookEvent webhookEvent)
    {
        _logger.LogInformation("Received webhook: {Type} for {EmailId}", webhookEvent.Type, webhookEvent.Data?.EmailId);

        if (string.IsNullOrEmpty(webhookEvent.Data?.EmailId)) return Ok();

        var email = await _context.SentEmails
            .FirstOrDefaultAsync(e => e.ResendId == webhookEvent.Data.EmailId);

        if (email == null)
        {
            _logger.LogWarning("Email not found for ResendId: {ResendId}", webhookEvent.Data.EmailId);
            return Ok();
        }

        switch (webhookEvent.Type)
        {
            case "email.delivered":
                email.Status = "delivered";
                break;
            case "email.opened":
                email.Status = "opened";
                email.OpenedAt = DateTime.UtcNow;
                if (email.CampaignId != null)
                {
                    var campaign = await _context.EmailCampaigns.FindAsync(email.CampaignId);
                    if (campaign != null) campaign.OpenedCount++;
                }
                break;
            case "email.clicked":
                email.Status = "clicked";
                email.ClickedAt = DateTime.UtcNow;
                if (email.CampaignId != null)
                {
                    var campaign = await _context.EmailCampaigns.FindAsync(email.CampaignId);
                    if (campaign != null) campaign.ClickedCount++;
                }
                break;
            case "email.bounced":
                email.Status = "bounced";
                if (email.CampaignId != null)
                {
                    var campaign = await _context.EmailCampaigns.FindAsync(email.CampaignId);
                    if (campaign != null) campaign.BouncedCount++;
                }
                break;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Get sent email history
    /// GET /api/email/history
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 50, [FromQuery] string? campaignId = null)
    {
        var query = _context.SentEmails.AsNoTracking();
        
        if (!string.IsNullOrEmpty(campaignId))
        {
            query = query.Where(e => e.CampaignId == campaignId);
        }

        var emails = await query
            .OrderByDescending(e => e.SentAt)
            .Take(limit)
            .ToListAsync();

        return Ok(new { emails, count = emails.Count });
    }

    /// <summary>
    /// Get email by ID
    /// GET /api/email/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmail(string id)
    {
        var email = await _emailService.GetEmailByIdAsync(id);
        if (email == null) return NotFound("Email not found");
        return Ok(email);
    }

    /// <summary>
    /// Get contacts for email compose (with email addresses)
    /// GET /api/email/contacts
    /// </summary>
    [HttpGet("contacts")]
    public async Task<IActionResult> GetContactsForEmail(
        [FromQuery] string? search = null, 
        [FromQuery] string? state = null,
        [FromQuery] int limit = 100)
    {
        var query = _context.Contacts
            .Include(c => c.Organisation)
            .Where(c => !string.IsNullOrEmpty(c.Email));

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => 
                c.FirstName.Contains(search) || 
                c.LastName.Contains(search) || 
                c.Email.Contains(search) ||
                (c.Organisation != null && c.Organisation.Name.Contains(search)));
        }

        if (!string.IsNullOrEmpty(state))
        {
            query = query.Where(c => c.Organisation != null && c.Organisation.State == state);
        }

        var contacts = await query
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .Take(limit)
            .Select(c => new {
                c.Id,
                c.FirstName,
                c.LastName,
                c.Email,
                c.JobTitle,
                OrganisationName = c.Organisation != null ? c.Organisation.Name : null,
                OrganisationId = c.OrganisationId,
                State = c.Organisation != null ? c.Organisation.State : null
            })
            .ToListAsync();

        return Ok(new { contacts, count = contacts.Count });
    }

    private string SubstituteVariables(string text, Contact contact)
    {
        if (string.IsNullOrEmpty(text)) return text;
        
        return text
            .Replace("{{firstName}}", contact.FirstName)
            .Replace("{{lastName}}", contact.LastName)
            .Replace("{{email}}", contact.Email)
            .Replace("{{jobTitle}}", contact.JobTitle);
    }
}

public class EmailToContactRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? SentBy { get; set; }
}

public class BulkSendRequest
{
    public List<string> ContactIds { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public string? TemplateId { get; set; }
    public string? CampaignName { get; set; }
    public string? SentBy { get; set; }
}

public class ResendWebhookEvent
{
    public string Type { get; set; } = string.Empty;
    public ResendWebhookData? Data { get; set; }
}

public class ResendWebhookData
{
    public string? EmailId { get; set; }
}

