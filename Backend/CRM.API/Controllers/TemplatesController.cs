using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(CrmDbContext context, ILogger<TemplatesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all email templates
    /// GET /api/templates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var templates = await _context.EmailTemplates
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return Ok(new { templates });
    }

    /// <summary>
    /// Get template by ID
    /// GET /api/templates/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var template = await _context.EmailTemplates.FindAsync(id);
        if (template == null) return NotFound();
        return Ok(template);
    }

    /// <summary>
    /// Create a new template
    /// POST /api/templates
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTemplateRequest request)
    {
        var template = new EmailTemplate
        {
            Name = request.Name,
            Subject = request.Subject,
            Body = request.Body,
            HtmlBody = request.HtmlBody ?? string.Empty,
            CreatedBy = request.CreatedBy ?? "CRM User",
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(template);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created email template: {Name}", template.Name);
        return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
    }

    /// <summary>
    /// Update a template
    /// PUT /api/templates/{id}
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateTemplateRequest request)
    {
        var template = await _context.EmailTemplates.FindAsync(id);
        if (template == null) return NotFound();

        template.Name = request.Name;
        template.Subject = request.Subject;
        template.Body = request.Body;
        template.HtmlBody = request.HtmlBody ?? string.Empty;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(template);
    }

    /// <summary>
    /// Delete a template
    /// DELETE /api/templates/{id}
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var template = await _context.EmailTemplates.FindAsync(id);
        if (template == null) return NotFound();

        _context.EmailTemplates.Remove(template);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Preview template with variable substitution
    /// POST /api/templates/{id}/preview
    /// </summary>
    [HttpPost("{id}/preview")]
    public async Task<IActionResult> Preview(string id, [FromBody] PreviewRequest request)
    {
        var template = await _context.EmailTemplates.FindAsync(id);
        if (template == null) return NotFound();

        var subject = SubstituteVariables(template.Subject, request.Variables);
        var body = SubstituteVariables(template.Body, request.Variables);
        var htmlBody = SubstituteVariables(template.HtmlBody, request.Variables);

        return Ok(new { subject, body, htmlBody });
    }

    private string SubstituteVariables(string text, Dictionary<string, string>? variables)
    {
        if (string.IsNullOrEmpty(text) || variables == null) return text;
        
        foreach (var (key, value) in variables)
        {
            text = text.Replace($"{{{{{key}}}}}", value); // {{variable}}
        }
        return text;
    }
}

public class CreateTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public string? CreatedBy { get; set; }
}

public class PreviewRequest
{
    public Dictionary<string, string>? Variables { get; set; }
}
