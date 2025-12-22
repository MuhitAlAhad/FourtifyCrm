using Resend;
using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services;

public interface IEmailService
{
    Task<SentEmail> SendEmailAsync(SendEmailRequest request);
    Task<List<SentEmail>> GetSentEmailsAsync(int limit = 50);
    Task<SentEmail?> GetEmailByIdAsync(string id);
}

public class SendEmailRequest
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string? ContactId { get; set; }
    public string? OrganisationId { get; set; }
    public string? CampaignId { get; set; }
    public string SentBy { get; set; } = "CRM User";
}

public class EmailService : IEmailService
{
    private readonly CrmDbContext _context;
    private readonly IResend _resend;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(
        CrmDbContext context, 
        IResend resend, 
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _context = context;
        _resend = resend;
        _configuration = configuration;
        _logger = logger;
        _fromEmail = configuration["Resend:FromEmail"] ?? "noreply@fourd.com.au";
        _fromName = configuration["Resend:FromName"] ?? "Fourtify CRM";
    }

    public async Task<SentEmail> SendEmailAsync(SendEmailRequest request)
    {
        var sentEmail = new SentEmail
        {
            ToEmail = request.ToEmail,
            ToName = request.ToName,
            FromEmail = _fromEmail,
            FromName = _fromName,
            Subject = request.Subject,
            Body = request.Body,
            HtmlBody = request.HtmlBody,
            ContactId = request.ContactId,
            OrganisationId = request.OrganisationId,
            CampaignId = request.CampaignId,
            SentBy = request.SentBy,
            SentAt = DateTime.UtcNow
        };

        try
        {
            // Send via Resend
            var message = new EmailMessage
            {
                From = $"{_fromName} <{_fromEmail}>",
                To = string.IsNullOrEmpty(request.ToName) 
                    ? request.ToEmail 
                    : $"{request.ToName} <{request.ToEmail}>",
                Subject = request.Subject,
                TextBody = request.Body,
                HtmlBody = string.IsNullOrEmpty(request.HtmlBody) ? null : request.HtmlBody
            };

            var response = await _resend.EmailSendAsync(message);
            
            if (response.Success)
            {
                sentEmail.Status = "sent";
                sentEmail.ResendId = response.Content.ToString();
                
                _logger.LogInformation("Email sent successfully to {Email}, ResendId: {ResendId}", 
                    request.ToEmail, response.Content);
            }
            else
            {
                sentEmail.Status = "failed";
                sentEmail.ErrorMessage = response.Exception?.Message ?? "Unknown error";
            }
        }
        catch (Exception ex)
        {
            sentEmail.Status = "failed";
            sentEmail.ErrorMessage = ex.Message;
            
            _logger.LogError(ex, "Failed to send email to {Email}", request.ToEmail);
        }

        // Save to database regardless of success/failure
        _context.SentEmails.Add(sentEmail);
        await _context.SaveChangesAsync();

        return sentEmail;
    }

    public async Task<List<SentEmail>> GetSentEmailsAsync(int limit = 50)
    {
        return await _context.SentEmails
            .Include(e => e.Contact)
            .Include(e => e.Organisation)
            .OrderByDescending(e => e.SentAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<SentEmail?> GetEmailByIdAsync(string id)
    {
        return await _context.SentEmails
            .Include(e => e.Contact)
            .Include(e => e.Organisation)
            .FirstOrDefaultAsync(e => e.Id == id);
    }
}
