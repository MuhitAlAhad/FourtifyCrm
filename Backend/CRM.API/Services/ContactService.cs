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
        
        // Log creation activity
        var activity = new ContactActivity
        {
            ContactId = contact.Id,
            ActivityType = "Created",
            Description = $"Contact {contact.FirstName} {contact.LastName} was created",
            UserName = contact.CreatedBy ?? "System"
        };
        _context.ContactActivities.Add(activity);
        await _context.SaveChangesAsync();
        
        return contact;
    }

    public async Task<Contact?> UpdateAsync(string id, Contact contact)
    {
        var existing = await _context.Contacts.FindAsync(id);
        if (existing == null) return null;

        // Track changes for activity log
        var changes = new List<ContactActivity>();
        
        if (existing.FirstName != contact.FirstName)
        {
            changes.Add(new ContactActivity
            {
                ContactId = id,
                ActivityType = "Updated",
                FieldName = "First Name",
                OldValue = existing.FirstName,
                NewValue = contact.FirstName,
                Description = $"First name changed from '{existing.FirstName}' to '{contact.FirstName}'",
                UserName = "User"
            });
        }
        
        if (existing.LastName != contact.LastName)
        {
            changes.Add(new ContactActivity
            {
                ContactId = id,
                ActivityType = "Updated",
                FieldName = "Last Name",
                OldValue = existing.LastName,
                NewValue = contact.LastName,
                Description = $"Last name changed from '{existing.LastName}' to '{contact.LastName}'",
                UserName = "User"
            });
        }
        
        if (existing.Email != contact.Email)
        {
            changes.Add(new ContactActivity
            {
                ContactId = id,
                ActivityType = "Updated",
                FieldName = "Email",
                OldValue = existing.Email,
                NewValue = contact.Email,
                Description = $"Email changed from '{existing.Email}' to '{contact.Email}'",
                UserName = "User"
            });
        }
        
        if (existing.Phone != contact.Phone)
        {
            changes.Add(new ContactActivity
            {
                ContactId = id,
                ActivityType = "Updated",
                FieldName = "Phone",
                OldValue = existing.Phone,
                NewValue = contact.Phone,
                Description = $"Phone changed from '{existing.Phone}' to '{contact.Phone}'",
                UserName = "User"
            });
        }
        
        if (existing.Status != contact.Status)
        {
            changes.Add(new ContactActivity
            {
                ContactId = id,
                ActivityType = "StatusChanged",
                FieldName = "Status",
                OldValue = existing.Status,
                NewValue = contact.Status,
                Description = $"Status changed from '{existing.Status}' to '{contact.Status}'",
                UserName = "User"
            });
        }

        existing.FirstName = contact.FirstName;
        existing.LastName = contact.LastName;
        existing.JobTitle = contact.JobTitle;
        existing.Email = contact.Email;
        existing.Phone = contact.Phone;
        existing.Mobile = contact.Mobile;
        existing.IsPrimary = contact.IsPrimary;
        existing.Notes = contact.Notes;
        existing.LinkedIn = contact.LinkedIn;
        existing.Status = contact.Status;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        // Log all changes
        if (changes.Any())
        {
            _context.ContactActivities.AddRange(changes);
            await _context.SaveChangesAsync();
        }
        
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

    public async Task<IEnumerable<ContactActivity>> GetActivitiesAsync(string contactId)
    {
        return await _context.ContactActivities
            .Where(a => a.ContactId == contactId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .AsNoTracking()
            .ToListAsync();
    }
}
