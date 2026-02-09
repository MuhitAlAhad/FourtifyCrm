using Resend;
using CRM.API.Data;
using CRM.API.Models;
using Microsoft.EntityFrameworkCore;
using DocumentFormat.OpenXml.Spreadsheet;
using Amazon.Runtime;
using Amazon.SimpleEmail;
using Amazon;
using Microsoft.Extensions.Options;
using Amazon.SimpleEmail.Model;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace CRM.API.Services;

public interface IEmailService
{
    Task<SentEmail> SendEmailAsync(SendEmailRequest request);
    Task<List<SentEmail>> SendBulkEmailAsync(List<SendEmailRequest> request);
    Task<List<SentEmail>> GetSentEmailsAsync(int limit = 50);
    Task<SentEmail?> GetEmailByIdAsync(string id);
   
}

public interface ISesEmailService
{
    Task<List<SesEmailSentResult>> SendBulkEmailAsync(
        List<string> recipients,
        string subject,
        string htmlBody);

}

public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
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
    public List<EmailAttachment>? Attachments { get; set; }
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

            // Add attachments if any
            if (request.Attachments != null && request.Attachments.Any())
            {
                message.Attachments = request.Attachments.Select(a => new Resend.EmailAttachment
                {
                    Filename = a.FileName,
                    Content = a.Content
                }).ToList();
            }

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

    public async Task<List<SentEmail>> SendBulkEmailAsync(List<SendEmailRequest> request)
    {
        const int batchSize = 100;
        const int delayBetweenBatchesMs = 500;

        List<EmailMessage> emailMessages = new();
        List<SentEmail> sentEmailEntities = new();

        try
        {
            // Build email + entity lists
            foreach (SendEmailRequest sendEmail in request)
            {
                sendEmail.ToEmail = "devfourd@gmail.com";

                var sentEmail = new SentEmail
                {
                    ToEmail = sendEmail.ToEmail,
                    ToName = sendEmail.ToName,
                    FromEmail = _fromEmail,
                    FromName = _fromName,
                    Subject = sendEmail.Subject,
                    Body = sendEmail.Body,
                    HtmlBody = sendEmail.HtmlBody,
                    ContactId = sendEmail.ContactId,
                    OrganisationId = sendEmail.OrganisationId,
                    CampaignId = sendEmail.CampaignId,
                    SentBy = sendEmail.SentBy,
                    SentAt = DateTime.UtcNow,
                    Status = "pending"
                };

                var message = new EmailMessage
                {
                    From = $"{_fromName} <{_fromEmail}>",
                    To = string.IsNullOrEmpty(sendEmail.ToName)
                        ? sendEmail.ToEmail
                        : $"{sendEmail.ToName} <{sendEmail.ToEmail}>",
                    Subject = sendEmail.Subject,
                    TextBody = sendEmail.Body,
                    HtmlBody = string.IsNullOrEmpty(sendEmail.HtmlBody)
                        ? null
                        : sendEmail.HtmlBody
                };

                sentEmailEntities.Add(sentEmail);
                emailMessages.Add(message);
            }

            // Send in batches of 100
            foreach (var batch in emailMessages.Chunk(batchSize))
            {
                try
                {
                    var response = await _resend.EmailBatchAsync(batch);

                    if (response.Success)
                    {
                        foreach (var email in sentEmailEntities
                                     .Skip(emailMessages.IndexOf(batch.First()))
                                     .Take(batch.Count()))
                        {
                            email.Status = "sent";
                            email.ResendId = response.Content?.ToString();
                        }

                        _logger.LogInformation(
                            "Batch of {Count} emails sent successfully. ResendId: {ResendId}",
                            batch.Count(),
                            response.Content
                        );
                    }
                    else
                    {
                        foreach (var email in sentEmailEntities
                                     .Skip(emailMessages.IndexOf(batch.First()))
                                     .Take(batch.Count()))
                        {
                            email.Status = "failed";
                            email.ErrorMessage = response.Exception?.Message ?? "Unknown error";
                        }
                    }
                }
                catch (Exception ex)
                {
                    foreach (var email in sentEmailEntities
                                 .Skip(emailMessages.IndexOf(batch.First()))
                                 .Take(batch.Count()))
                    {
                        email.Status = "failed";
                        email.ErrorMessage = ex.Message;
                    }

                    _logger.LogError(ex, "Failed to send email batch");
                }

                // Delay to avoid Resend rate limits
                await Task.Delay(delayBetweenBatchesMs);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bulk email process failed");
            throw;
        }

        // Save all email records
        //_context.SentEmails.AddRange(sentEmailEntities);
        //await _context.SaveChangesAsync();

        return sentEmailEntities;
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

public class SesEmailService : ISesEmailService
{
    private readonly SesSettings _settings;
    private readonly ILogger<SesEmailService> _logger;
    private readonly AmazonSimpleEmailServiceClient _client;

    public SesEmailService(
        IOptions<SesSettings> options,
        ILogger<SesEmailService> logger)
    {
        _settings = options.Value;
        _logger = logger;

        _client = new AmazonSimpleEmailServiceClient(
            new BasicAWSCredentials(_settings.AccessKey, _settings.SecretKey),
            RegionEndpoint.GetBySystemName(_settings.Region));
    }

    public async Task<List<SesEmailSentResult>> SendBulkEmailAsync(
    List<string> recipients,
    string subject,
    string htmlBody)
    {
        const int batchSize = 50;
        const int delayMs = 300;

        var results = new List<SesEmailSentResult>();

        foreach (var batch in recipients.Chunk(batchSize))
        {
            var request = new Amazon.SimpleEmail.Model.SendEmailRequest
            {
                Source = _settings.FromAddress,
                Destination = new Destination
                {
                    // Use Bcc instead of To
                    BccAddresses = batch.ToList()
                },
                Message = new Message
                {
                    Subject = new Content(subject),
                    Body = new Body
                    {
                        Html = new Content(htmlBody)
                    }
                }
            };

            try
            {
                await _client.SendEmailAsync(request);

                // If no exception, all in batch considered successful
                results.AddRange(batch.Select(email => new SesEmailSentResult
                {
                    Email = email,
                    Success = true
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SES batch failed");

                // Mark all emails in this batch as failed
                results.AddRange(batch.Select(email => new SesEmailSentResult
                {
                    Email = email,
                    Success = false,
                    ErrorMessage = ex.Message
                }));
            }

            // throttle
            await Task.Delay(delayMs);
        }

        return results;
    }

}

public class SesSettings
{
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
}

public class SesEmailSentResult
{
    public string Email { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

public static class EnumerableExtensions
{
    public static IEnumerable<List<T>> ChunkBy<T>(this IEnumerable<T> source, int size)
    {
        var chunk = new List<T>(size);

        foreach (var item in source)
        {
            chunk.Add(item);

            if (chunk.Count == size)
            {
                yield return chunk;
                chunk = new List<T>(size);
            }
        }

        if (chunk.Any())
            yield return chunk;
    }
}
