using Microsoft.EntityFrameworkCore;
using CRM.API.Models;

namespace CRM.API.Data;

public class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    // Core tables
    public DbSet<Organisation> Organisations { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Lead> Leads { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<User> Users { get; set; }
    
    // New tables
    public DbSet<Proposal> Proposals { get; set; }
    public DbSet<CrmTask> Tasks { get; set; }
    public DbSet<Note> Notes { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<SentEmail> SentEmails { get; set; }
    public DbSet<EmailTemplate> EmailTemplates { get; set; }
    public DbSet<EmailCampaign> EmailCampaigns { get; set; }
    public DbSet<Meeting> Meetings { get; set; }
    public DbSet<Client> Clients { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============ ORGANISATION ============
        modelBuilder.Entity<Organisation>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Abn);
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.State);
            
            // Relationships
            entity.HasMany(e => e.Contacts)
                .WithOne(e => e.Organisation)
                .HasForeignKey(e => e.OrganisationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.Leads)
                .WithOne(e => e.Organisation)
                .HasForeignKey(e => e.OrganisationId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(e => e.Proposals)
                .WithOne(e => e.Organisation)
                .HasForeignKey(e => e.OrganisationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ============ CONTACT ============
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.OrganisationId);
            entity.HasIndex(e => new { e.FirstName, e.LastName });
        });

        // ============ LEAD ============
        modelBuilder.Entity<Lead>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Stage);
            entity.HasIndex(e => e.OrganisationId);
            entity.HasIndex(e => e.ContactId);
            entity.HasIndex(e => e.Owner);
            entity.HasIndex(e => e.Priority);
            
            entity.Property(e => e.ExpectedValue).HasColumnType("decimal(18,2)");
            
            // Relationships
            entity.HasMany(e => e.Proposals)
                .WithOne(e => e.Lead)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(e => e.Tasks)
                .WithOne(e => e.Lead)
                .HasForeignKey(e => e.LeadId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ============ ACTIVITY ============
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.ActivityDate);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.ContactId);
            entity.HasIndex(e => e.OrganisationId);
            entity.HasIndex(e => e.UserId);
        });

        // ============ USER ============
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Unique constraint on email
            entity.HasIndex(e => e.Email).IsUnique();
            
            // Relationships
            entity.HasMany(e => e.Activities)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(e => e.AssignedTasks)
                .WithOne(e => e.AssignedUser)
                .HasForeignKey(e => e.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ============ PROPOSAL ============
        modelBuilder.Entity<Proposal>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.OrganisationId);
            
            entity.Property(e => e.Value).HasColumnType("decimal(18,2)");
        });

        // ============ TASK ============
        modelBuilder.Entity<CrmTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => e.AssignedTo);
            entity.HasIndex(e => e.LeadId);
        });

        // ============ NOTE ============
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.ContactId);
            entity.HasIndex(e => e.OrganisationId);
            entity.HasIndex(e => e.IsPinned);
        });

        // ============ ATTACHMENT ============
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Indexes
            entity.HasIndex(e => e.LeadId);
            entity.HasIndex(e => e.ProposalId);
            entity.HasIndex(e => e.OrganisationId);
        });
    }
}
