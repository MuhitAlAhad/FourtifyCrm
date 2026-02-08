using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM.API.Models;

[Table("organisations")]
public class Organisation
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"org:{Guid.NewGuid()}";
    
    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("phone")]
    public string Phone { get; set; } = string.Empty;
    
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    
    [Column("address")]
    public string Address { get; set; } = string.Empty;
    
    [Column("website")]
    public string Website { get; set; } = string.Empty;
    
    [Column("industry")]
    public string Industry { get; set; } = string.Empty;
    
    [Column("size")]
    public string Size { get; set; } = string.Empty;
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("abn")]
    public string Abn { get; set; } = string.Empty;
    
    [Column("state")]
    public string State { get; set; } = string.Empty;
    
    [Column("postcode")]
    public string Postcode { get; set; } = string.Empty;
    
    [Column("supplier_name")]
    public string SupplierName { get; set; } = string.Empty;
    
    [Column("deed_start_date")]
    public string DeedStartDate { get; set; } = string.Empty;
    
    [Column("deed_end_date")]
    public string DeedEndDate { get; set; } = string.Empty;
    
    [Column("status")]
    public string Status { get; set; } = "prospect"; // prospect, active, partner, inactive
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
}

[Table("contacts")]
public class Contact
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"contact:{Guid.NewGuid()}";
    
    [Column("organisation_id")]
    public string OrganisationId { get; set; } = string.Empty;
    
    [Required]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;
    
    [Column("job_title")]
    public string JobTitle { get; set; } = string.Empty;
    
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    
    [Column("phone")]
    public string Phone { get; set; } = string.Empty;
    
    [Column("mobile")]
    public string Mobile { get; set; } = string.Empty;
    
    [Column("is_primary")]
    public bool IsPrimary { get; set; }
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("linkedin")]
    public string LinkedIn { get; set; } = string.Empty;
    
    [Column("status")]
    public string Status { get; set; } = "new"; // new, contacted, qualified, converted
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

[Table("leads")]
public class Lead
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"lead:{Guid.NewGuid()}";
    
    [Column("organisation_id")]
    public string OrganisationId { get; set; } = string.Empty;
    
    [Column("contact_id")]
    public string ContactId { get; set; } = string.Empty;
    
    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("stage")]
    public string Stage { get; set; } = "New Lead";
    
    [Column("expected_value")]
    public decimal ExpectedValue { get; set; }
    
    [Column("probability")]
    public int Probability { get; set; } = 10;
    
    [Column("expected_close_date")]
    public string ExpectedCloseDate { get; set; } = string.Empty;
    
    [Column("owner")]
    public string Owner { get; set; } = string.Empty;
    
    [Column("source")]
    public string Source { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("priority")]
    public string Priority { get; set; } = "Medium";
    
    [Column("tags")]
    public string[] Tags { get; set; } = Array.Empty<string>();
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
    
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    public ICollection<Proposal> Proposals { get; set; } = new List<Proposal>();
    public ICollection<CrmTask> Tasks { get; set; } = new List<CrmTask>();
}

[Table("activities")]
public class Activity
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"activity:{Guid.NewGuid()}";
    
    [Required]
    [Column("type")]
    public string Type { get; set; } = string.Empty; // email, call, meeting, note
    
    [Column("subject")]
    public string Subject { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("outcome")]
    public string Outcome { get; set; } = string.Empty; // successful, failed, pending, no_answer
    
    [Column("duration_minutes")]
    public int? DurationMinutes { get; set; }
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("contact_id")]
    public string? ContactId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("user_id")]
    public string? UserId { get; set; }
    
    [Column("activity_date")]
    public DateTime ActivityDate { get; set; } = DateTime.UtcNow;
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }
    
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"user:{Guid.NewGuid()}";
    
    [Required]
    [Column("email")]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Column("role")]
    public string Role { get; set; } = "Admin"; // Admin, SuperAdmin
    
    [Column("status")]
    public string Status { get; set; } = "pending_verification"; // pending_verification, pending_approval, active, rejected
    
    [Column("email_verification_token")]
    public string? EmailVerificationToken { get; set; }
    
    [Column("email_verified_at")]
    public DateTime? EmailVerifiedAt { get; set; }
    
    [Column("approved_by")]
    public string? ApprovedBy { get; set; }
    
    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }
    
    [Column("rejected_reason")]
    public string? RejectedReason { get; set; }
    
    [Column("is_active")]
    public bool IsActive { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }
    
    [Column("signature_html")]
    public string? SignatureHtml { get; set; }
    
    // Navigation properties
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<CrmTask> AssignedTasks { get; set; } = new List<CrmTask>();
}

// NEW TABLES

[Table("proposals")]
public class Proposal
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"proposal:{Guid.NewGuid()}";
    
    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("status")]
    public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, Rejected, Expired
    
    [Column("value")]
    public decimal Value { get; set; }
    
    [Column("valid_until")]
    public DateTime? ValidUntil { get; set; }
    
    [Column("sent_date")]
    public DateTime? SentDate { get; set; }
    
    [Column("content")]
    public string Content { get; set; } = string.Empty;
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

[Table("crm_tasks")]
public class CrmTask
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"task:{Guid.NewGuid()}";
    
    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("due_date")]
    public DateTime? DueDate { get; set; }
    
    [Column("priority")]
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
    
    [Column("status")]
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Cancelled
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("contact_id")]
    public string? ContactId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("assigned_to")]
    public string? AssignedTo { get; set; }
    
    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
    
    [ForeignKey("AssignedTo")]
    public User? AssignedUser { get; set; }
}

[Table("notes")]
public class Note
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"note:{Guid.NewGuid()}";
    
    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("contact_id")]
    public string? ContactId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("is_pinned")]
    public bool IsPinned { get; set; }
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

[Table("attachments")]
public class Attachment
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"attachment:{Guid.NewGuid()}";
    
    [Required]
    [Column("file_name")]
    public string FileName { get; set; } = string.Empty;
    
    [Column("file_path")]
    public string FilePath { get; set; } = string.Empty;
    
    [Column("file_size")]
    public long FileSize { get; set; }
    
    [Column("content_type")]
    public string ContentType { get; set; } = string.Empty;
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("proposal_id")]
    public string? ProposalId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("ProposalId")]
    public Proposal? Proposal { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

// ============ EMAIL TEMPLATE ============
[Table("email_templates")]
public class EmailTemplate
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"template:{Guid.NewGuid()}";
    
    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Column("subject")]
    public string Subject { get; set; } = string.Empty;
    
    [Column("body")]
    public string Body { get; set; } = string.Empty;
    
    [Column("html_body")]
    public string HtmlBody { get; set; } = string.Empty;
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}

// ============ EMAIL CAMPAIGN ============
[Table("email_campaigns")]
public class EmailCampaign
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"campaign:{Guid.NewGuid()}";
    
    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("subject")]
    public string Subject { get; set; } = string.Empty;
    
    [Column("body")]
    public string Body { get; set; } = string.Empty;
    
    [Column("html_body")]
    public string HtmlBody { get; set; } = string.Empty;
    
    [Column("template_id")]
    public string? TemplateId { get; set; }
    
    [Column("status")]
    public string Status { get; set; } = "draft"; // draft, sending, sent
    
    [Column("total_recipients")]
    public int TotalRecipients { get; set; } = 0;
    
    [Column("sent_count")]
    public int SentCount { get; set; } = 0;
    
    [Column("opened_count")]
    public int OpenedCount { get; set; } = 0;
    
    [Column("clicked_count")]
    public int ClickedCount { get; set; } = 0;
    
    [Column("bounced_count")]
    public int BouncedCount { get; set; } = 0;
    
    [Column("failed_count")]
    public int FailedCount { get; set; } = 0;
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("sent_at")]
    public DateTime? SentAt { get; set; }
    
    // Navigation
    [ForeignKey("TemplateId")]
    public EmailTemplate? Template { get; set; }
    
    public ICollection<SentEmail> Emails { get; set; } = new List<SentEmail>();
}

// ============ SENT EMAIL ============
[Table("sent_emails")]
public class SentEmail
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"email:{Guid.NewGuid()}";
    
    [Required]
    [Column("to_email")]
    public string ToEmail { get; set; } = string.Empty;
    
    [Column("to_name")]
    public string ToName { get; set; } = string.Empty;
    
    [Required]
    [Column("from_email")]
    public string FromEmail { get; set; } = string.Empty;
    
    [Column("from_name")]
    public string FromName { get; set; } = string.Empty;
    
    [Required]
    [Column("subject")]
    public string Subject { get; set; } = string.Empty;
    
    [Column("body")]
    public string Body { get; set; } = string.Empty;
    
    [Column("html_body")]
    public string HtmlBody { get; set; } = string.Empty;
    
    [Column("status")]
    public string Status { get; set; } = "sent"; // sent, delivered, opened, clicked, bounced, failed
    
    [Column("resend_id")]
    public string? ResendId { get; set; }
    
    [Column("error_message")]
    public string? ErrorMessage { get; set; }
    
    [Column("contact_id")]
    public string? ContactId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("campaign_id")]
    public string? CampaignId { get; set; }
    
    [Column("opened_at")]
    public DateTime? OpenedAt { get; set; }
    
    [Column("clicked_at")]
    public DateTime? ClickedAt { get; set; }
    
    [Column("sent_by")]
    public string SentBy { get; set; } = string.Empty;
    
    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
    
    [ForeignKey("CampaignId")]
    public EmailCampaign? Campaign { get; set; }
}

// ============ MEETING ============
[Table("meetings")]
public class Meeting
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"meeting:{Guid.NewGuid()}";
    
    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [Column("meeting_date")]
    public DateTime MeetingDate { get; set; }
    
    [Column("duration_minutes")]
    public int DurationMinutes { get; set; } = 60;
    
    [Column("location")]
    public string Location { get; set; } = string.Empty;
    
    [Column("meeting_type")]
    public string MeetingType { get; set; } = "call"; // call, video, in-person
    
    [Column("status")]
    public string Status { get; set; } = "scheduled"; // scheduled, completed, cancelled
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    // Foreign keys
    [Column("contact_id")]
    public string? ContactId { get; set; }
    
    [Column("lead_id")]
    public string? LeadId { get; set; }
    
    [Column("organisation_id")]
    public string? OrganisationId { get; set; }
    
    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
    
    [ForeignKey("LeadId")]
    public Lead? Lead { get; set; }
    
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

// Client - paying customers linked to Organisations
[Table("clients")]
public class Client
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"client:{Guid.NewGuid()}";
    
    [Required]
    [Column("organisation_id")]
    public string OrganisationId { get; set; } = string.Empty;
    
    [Required]
    [Column("plan")]
    public string Plan { get; set; } = "Professional"; // Professional, Enterprise, Custom
    
    [Column("status")]
    public string Status { get; set; } = "active"; // active, onboarding, churned
    
    [Column("mrr")]
    public decimal Mrr { get; set; } = 0; // Monthly Recurring Revenue
    
    [Column("contract_start")]
    public DateTime? ContractStart { get; set; }
    
    [Column("contract_end")]
    public DateTime? ContractEnd { get; set; }
    
    [Column("disp_compliant")]
    public bool DispCompliant { get; set; } = false;
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    [ForeignKey("OrganisationId")]
    public Organisation? Organisation { get; set; }
}

[Table("contact_activities")]
public class ContactActivity
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"activity:{Guid.NewGuid()}";
    
    [Required]
    [Column("contact_id")]
    public string ContactId { get; set; } = string.Empty;
    
    [Required]
    [Column("activity_type")]
    public string ActivityType { get; set; } = string.Empty; // Created, Updated, StatusChanged, etc.
    
    [Column("field_name")]
    public string FieldName { get; set; } = string.Empty;
    
    [Column("old_value")]
    public string OldValue { get; set; } = string.Empty;
    
    [Column("new_value")]
    public string NewValue { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("user_name")]
    public string UserName { get; set; } = "System";
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    [ForeignKey("ContactId")]
    public Contact? Contact { get; set; }
}

[Table("invoices")]
public class Invoice
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"invoice:{Guid.NewGuid()}";
    
    [Required]
    [Column("client_id")]
    public string ClientId { get; set; } = string.Empty;
    
    [Required]
    [Column("invoice_number")]
    public string InvoiceNumber { get; set; } = string.Empty;
    
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("amount")]
    public decimal Amount { get; set; } = 0;
    
    [Column("tax")]
    public decimal Tax { get; set; } = 0;
    
    [Column("total_amount")]
    public decimal TotalAmount { get; set; } = 0;
    
    [Column("status")]
    public string Status { get; set; } = "draft"; // draft, sent, paid, overdue, cancelled
    
    [Column("issue_date")]
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    
    [Column("due_date")]
    public DateTime? DueDate { get; set; }
    
    [Column("paid_date")]
    public DateTime? PaidDate { get; set; }
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ClientId")]
    public Client? Client { get; set; }
    
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
}

[Table("invoice_line_items")]
public class InvoiceLineItem
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"line:{Guid.NewGuid()}";
    
    [Required]
    [Column("invoice_id")]
    public string InvoiceId { get; set; } = string.Empty;
    
    [Required]
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("quantity")]
    public decimal Quantity { get; set; } = 1;
    
    [Column("unit_price")]
    public decimal UnitPrice { get; set; } = 0;
    
    [Column("total")]
    public decimal Total { get; set; } = 0;
    
    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    [ForeignKey("InvoiceId")]
    public Invoice? Invoice { get; set; }
}

[Table("payments")]
public class Payment
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = $"payment:{Guid.NewGuid()}";
    
    [Column("invoice_id")]
    public string? InvoiceId { get; set; }
    
    [Required]
    [Column("client_id")]
    public string ClientId { get; set; } = string.Empty;
    
    [Column("amount")]
    public decimal Amount { get; set; } = 0;
    
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = "bank_transfer"; // bank_transfer, credit_card, cheque, cash
    
    [Column("payment_date")]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    
    [Column("reference")]
    public string Reference { get; set; } = string.Empty;
    
    [Column("notes")]
    public string Notes { get; set; } = string.Empty;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ClientId")]
    public Client? Client { get; set; }
    
    [ForeignKey("InvoiceId")]
    public Invoice? Invoice { get; set; }
}

