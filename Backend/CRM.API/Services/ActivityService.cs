using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services;

public class ActivityService : IActivityService
{
    private readonly CrmDbContext _context;

    public ActivityService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Activity>> GetAllAsync(int limit = 20)
    {
        return await _context.Activities
            .OrderByDescending(a => a.ActivityDate)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<Activity>> GetByLeadIdAsync(string leadId)
    {
        return await _context.Activities
            .Where(a => a.LeadId == leadId)
            .OrderByDescending(a => a.ActivityDate)
            .ToListAsync();
    }

    public async Task<Activity> CreateAsync(Activity activity)
    {
        activity.Id = $"activity:{Guid.NewGuid()}";
        activity.CreatedAt = DateTime.UtcNow;
        
        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
        
        return activity;
    }
}

public class StatsService : IStatsService
{
    private readonly CrmDbContext _context;

    public StatsService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStats> GetDashboardStatsAsync()
    {
        var leads = await _context.Leads.ToListAsync();
        var closedWonLeads = leads.Where(l => l.Stage == "Closed Won").ToList();
        var activeStages = new[] { "New Lead", "Qualified Lead", "Engaged – Under Discussion", 
            "Proposal / Pricing Sent", "Security Assessment", "Awaiting Decision", "Contracting / Legal" };
        var activeLeads = leads.Where(l => activeStages.Contains(l.Stage)).ToList();

        var totalLeads = leads.Count;
        var closedWonCount = closedWonLeads.Count;
        var closedLostCount = leads.Count(l => l.Stage == "Closed Lost");
        var totalClosed = closedWonCount + closedLostCount;
        
        return new DashboardStats
        {
            TotalLeads = totalLeads,
            ActiveLeads = activeLeads.Count,
            TotalOrganisations = await _context.Organisations.CountAsync(),
            TotalContacts = await _context.Contacts.CountAsync(),
            PipelineValue = activeLeads.Sum(l => l.ExpectedValue),
            ClosedWonValue = closedWonLeads.Sum(l => l.ExpectedValue),
            ConversionRate = totalClosed > 0 ? Math.Round((double)closedWonCount / totalClosed * 100, 1) : 0,
            AvgDealSize = closedWonCount > 0 ? closedWonLeads.Sum(l => l.ExpectedValue) / closedWonCount : 0
        };
    }
}
