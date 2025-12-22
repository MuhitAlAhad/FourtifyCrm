using CRM.API.Models;

namespace CRM.API.Services;

public interface IOrganisationService
{
    Task<IEnumerable<Organisation>> GetAllAsync(string? search = null);
    Task<Organisation?> GetByIdAsync(string id);
    Task<Organisation> CreateAsync(Organisation organisation);
    Task<Organisation?> UpdateAsync(string id, Organisation organisation);
    Task<bool> DeleteAsync(string id);
}

public interface IContactService
{
    Task<IEnumerable<Contact>> GetAllAsync(string? organisationId = null, string? search = null);
    Task<Contact?> GetByIdAsync(string id);
    Task<Contact> CreateAsync(Contact contact);
    Task<Contact?> UpdateAsync(string id, Contact contact);
    Task<bool> DeleteAsync(string id);
}

public interface ILeadService
{
    Task<IEnumerable<Lead>> GetAllAsync(string? stage = null);
    Task<Lead?> GetByIdAsync(string id);
    Task<Lead> CreateAsync(Lead lead);
    Task<Lead?> UpdateAsync(string id, Lead lead);
    Task<Lead?> UpdateStageAsync(string id, string stage);
    Task<bool> DeleteAsync(string id);
    Task DeleteAllAsync();
}

public interface IActivityService
{
    Task<IEnumerable<Activity>> GetAllAsync(int limit = 20);
    Task<IEnumerable<Activity>> GetByLeadIdAsync(string leadId);
    Task<Activity> CreateAsync(Activity activity);
}

public interface IStatsService
{
    Task<DashboardStats> GetDashboardStatsAsync();
}

public class DashboardStats
{
    public int TotalLeads { get; set; }
    public int ActiveLeads { get; set; }
    public int TotalOrganisations { get; set; }
    public int TotalContacts { get; set; }
    public decimal PipelineValue { get; set; }
    public decimal ClosedWonValue { get; set; }
    public double ConversionRate { get; set; }
    public decimal AvgDealSize { get; set; }
}
