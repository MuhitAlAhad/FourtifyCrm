using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services;

public class ContactService : IContactService
{
    private readonly CrmDbContext _context;

    public ContactService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Contact>> GetAllAsync(string? organisationId = null, string? search = null)
    {
        var query = _context.Contacts.AsNoTracking();
        
        if (!string.IsNullOrEmpty(organisationId))
        {
            query = query.Where(c => c.OrganisationId == organisationId);
        }
        
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(c => 
                c.FirstName.ToLower().Contains(search) ||
                c.LastName.ToLower().Contains(search) ||
                c.Email.ToLower().Contains(search));
        }
        
        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Contact?> GetByIdAsync(string id)
    {
        return await _context.Contacts
            .AsNoTracking()
            .Include(c => c.Organisation)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Contact> CreateAsync(Contact contact)
    {
        contact.Id = $"contact:{Guid.NewGuid()}";
        contact.CreatedAt = DateTime.UtcNow;
        
        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();
        
        return contact;
    }

    public async Task<Contact?> UpdateAsync(string id, Contact contact)
    {
        var existing = await _context.Contacts.FindAsync(id);
        if (existing == null) return null;

        existing.FirstName = contact.FirstName;
        existing.LastName = contact.LastName;
        existing.JobTitle = contact.JobTitle;
        existing.Email = contact.Email;
        existing.Phone = contact.Phone;
        existing.Mobile = contact.Mobile;
        existing.IsPrimary = contact.IsPrimary;
        existing.Notes = contact.Notes;
        existing.LinkedIn = contact.LinkedIn;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null) return false;

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();
        return true;
    }
}
