using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly CrmDbContext _context;

    public MeetingsController(CrmDbContext context)
    {
        _context = context;
    }

    // GET: api/meetings
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MeetingDto>>> GetMeetings([FromQuery] bool upcoming = false)
    {
        var query = _context.Meetings
            .Include(m => m.Contact)
            .Include(m => m.Lead)
            .Include(m => m.Organisation)
            .AsQueryable();

        if (upcoming)
        {
            query = query.Where(m => m.MeetingDate >= DateTime.UtcNow && m.Status == "scheduled");
        }

        var meetings = await query
            .OrderBy(m => m.MeetingDate)
            .Take(50)
            .ToListAsync();

        return meetings.Select(m => MapToDto(m)).ToList();
    }

    // GET: api/meetings/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<MeetingDto>> GetMeeting(string id)
    {
        var meeting = await _context.Meetings
            .Include(m => m.Contact)
            .Include(m => m.Lead)
            .Include(m => m.Organisation)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting == null)
            return NotFound();

        return MapToDto(meeting);
    }

    // POST: api/meetings
    [HttpPost]
    public async Task<ActionResult<MeetingDto>> CreateMeeting(CreateMeetingRequest request)
    {
        var meeting = new Meeting
        {
            Title = request.Title,
            Description = request.Description ?? "",
            MeetingDate = request.MeetingDate,
            DurationMinutes = request.DurationMinutes ?? 60,
            Location = request.Location ?? "",
            MeetingType = request.MeetingType ?? "call",
            ContactId = request.ContactId,
            LeadId = request.LeadId,
            OrganisationId = request.OrganisationId,
            CreatedBy = request.CreatedBy ?? ""
        };

        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync();

        // Reload with relationships
        var created = await _context.Meetings
            .Include(m => m.Contact)
            .Include(m => m.Lead)
            .Include(m => m.Organisation)
            .FirstAsync(m => m.Id == meeting.Id);

        return CreatedAtAction(nameof(GetMeeting), new { id = meeting.Id }, MapToDto(created));
    }

    // PUT: api/meetings/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<MeetingDto>> UpdateMeeting(string id, UpdateMeetingRequest request)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null)
            return NotFound();

        if (request.Title != null) meeting.Title = request.Title;
        if (request.Description != null) meeting.Description = request.Description;
        if (request.MeetingDate.HasValue) meeting.MeetingDate = request.MeetingDate.Value;
        if (request.DurationMinutes.HasValue) meeting.DurationMinutes = request.DurationMinutes.Value;
        if (request.Location != null) meeting.Location = request.Location;
        if (request.MeetingType != null) meeting.MeetingType = request.MeetingType;
        if (request.Status != null) meeting.Status = request.Status;
        if (request.Notes != null) meeting.Notes = request.Notes;
        if (request.ContactId != null) meeting.ContactId = request.ContactId;
        if (request.LeadId != null) meeting.LeadId = request.LeadId;
        if (request.OrganisationId != null) meeting.OrganisationId = request.OrganisationId;
        
        meeting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updated = await _context.Meetings
            .Include(m => m.Contact)
            .Include(m => m.Lead)
            .Include(m => m.Organisation)
            .FirstAsync(m => m.Id == id);

        return MapToDto(updated);
    }

    // DELETE: api/meetings/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMeeting(string id)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null)
            return NotFound();

        _context.Meetings.Remove(meeting);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/meetings/{id}/complete
    [HttpPut("{id}/complete")]
    public async Task<ActionResult<MeetingDto>> CompleteMeeting(string id, [FromBody] CompleteRequest? request)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null)
            return NotFound();

        meeting.Status = "completed";
        if (request?.Notes != null) meeting.Notes = request.Notes;
        meeting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(meeting);
    }

    // PUT: api/meetings/{id}/cancel
    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<MeetingDto>> CancelMeeting(string id)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null)
            return NotFound();

        meeting.Status = "cancelled";
        meeting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(meeting);
    }

    private static MeetingDto MapToDto(Meeting m) => new()
    {
        Id = m.Id,
        Title = m.Title,
        Description = m.Description,
        MeetingDate = m.MeetingDate,
        DurationMinutes = m.DurationMinutes,
        Location = m.Location,
        MeetingType = m.MeetingType,
        Status = m.Status,
        Notes = m.Notes,
        ContactId = m.ContactId,
        ContactName = m.Contact != null ? $"{m.Contact.FirstName} {m.Contact.LastName}" : null,
        LeadId = m.LeadId,
        LeadTitle = m.Lead?.Name,
        OrganisationId = m.OrganisationId,
        OrganisationName = m.Organisation?.Name,
        CreatedBy = m.CreatedBy,
        CreatedAt = m.CreatedAt
    };
}

// DTOs
public record CreateMeetingRequest
{
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required DateTime MeetingDate { get; init; }
    public int? DurationMinutes { get; init; }
    public string? Location { get; init; }
    public string? MeetingType { get; init; }
    public string? ContactId { get; init; }
    public string? LeadId { get; init; }
    public string? OrganisationId { get; init; }
    public string? CreatedBy { get; init; }
}

public record UpdateMeetingRequest
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public DateTime? MeetingDate { get; init; }
    public int? DurationMinutes { get; init; }
    public string? Location { get; init; }
    public string? MeetingType { get; init; }
    public string? Status { get; init; }
    public string? Notes { get; init; }
    public string? ContactId { get; init; }
    public string? LeadId { get; init; }
    public string? OrganisationId { get; init; }
}

public record CompleteRequest
{
    public string? Notes { get; init; }
}

public record MeetingDto
{
    public string Id { get; init; } = "";
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public DateTime MeetingDate { get; init; }
    public int DurationMinutes { get; init; }
    public string Location { get; init; } = "";
    public string MeetingType { get; init; } = "";
    public string Status { get; init; } = "";
    public string Notes { get; init; } = "";
    public string? ContactId { get; init; }
    public string? ContactName { get; init; }
    public string? LeadId { get; init; }
    public string? LeadTitle { get; init; }
    public string? OrganisationId { get; init; }
    public string? OrganisationName { get; init; }
    public string CreatedBy { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}
