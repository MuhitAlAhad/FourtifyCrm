using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services;

public class LeadService : ILeadService
{
    private readonly CrmDbContext _context;

    public LeadService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Lead>> GetAllAsync(string? stage = null)
    {
        var query = _context.Leads.AsNoTracking();
        
        if (!string.IsNullOrEmpty(stage))
        {
            query = query.Where(l => l.Stage == stage);
        }

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        
      //  return await query
        //    .Include(l => l.Organisation)
         //   .Include(l => l.Contact)
         //   .OrderByDescending(l => l.CreatedAt)
         //   .ToListAsync();
    }

    public async Task<Lead?> GetByIdAsync(string id)
    {
        return await _context.Leads
            .AsNoTracking()
            .Include(l => l.Organisation)
            .Include(l => l.Contact)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<Lead> CreateAsync(Lead lead)
    {
        lead.Id = $"lead:{Guid.NewGuid()}";
        lead.CreatedAt = DateTime.UtcNow;
        
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();
        
        return lead;
    }

    public async Task<Lead?> UpdateAsync(string id, Lead lead)
    {
        var existing = await _context.Leads.FindAsync(id);
        if (existing == null) return null;

        existing.Name = lead.Name;
        existing.OrganisationId = lead.OrganisationId;
        existing.ContactId = lead.ContactId;
        existing.Stage = lead.Stage;
        existing.ExpectedValue = lead.ExpectedValue;
        existing.Probability = lead.Probability;
        existing.ExpectedCloseDate = lead.ExpectedCloseDate;
        existing.Owner = lead.Owner;
        existing.Source = lead.Source;
        existing.Description = lead.Description;
        existing.Priority = lead.Priority;
        existing.Tags = lead.Tags;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<Lead?> UpdateStageAsync(string id, string stage)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return null;

        lead.Stage = stage;
        lead.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return lead;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null) return false;

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task DeleteAllAsync()
    {
        _context.Leads.RemoveRange(_context.Leads);
        await _context.SaveChangesAsync();
    }
}
