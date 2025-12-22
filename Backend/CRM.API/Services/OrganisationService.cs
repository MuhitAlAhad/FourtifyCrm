using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services;

public class OrganisationService : IOrganisationService
{
    private readonly CrmDbContext _context;

    public OrganisationService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Organisation>> GetAllAsync(string? search = null)
    {
        var query = _context.Organisations.AsNoTracking();
        
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(o => 
                o.Name.ToLower().Contains(search) ||
                o.Abn.Contains(search) ||
                o.State.ToLower().Contains(search));
        }
        
        return await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Organisation?> GetByIdAsync(string id)
    {
        return await _context.Organisations
            .AsNoTracking()
            .Include(o => o.Contacts)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<Organisation> CreateAsync(Organisation organisation)
    {
        organisation.Id = $"org:{Guid.NewGuid()}";
        organisation.CreatedAt = DateTime.UtcNow;
        
        _context.Organisations.Add(organisation);
        await _context.SaveChangesAsync();
        
        return organisation;
    }

    public async Task<Organisation?> UpdateAsync(string id, Organisation organisation)
    {
        var existing = await _context.Organisations.FindAsync(id);
        if (existing == null) return null;

        existing.Name = organisation.Name;
        existing.Phone = organisation.Phone;
        existing.Email = organisation.Email;
        existing.Address = organisation.Address;
        existing.Website = organisation.Website;
        existing.Industry = organisation.Industry;
        existing.Size = organisation.Size;
        existing.Notes = organisation.Notes;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var organisation = await _context.Organisations.FindAsync(id);
        if (organisation == null) return false;

        _context.Organisations.Remove(organisation);
        await _context.SaveChangesAsync();
        return true;
    }
}
