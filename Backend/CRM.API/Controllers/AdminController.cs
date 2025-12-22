using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRM.API.Data;
using CRM.API.Models;
using Resend;
using System.Security.Claims;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IResend _resend;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        CrmDbContext context,
        IConfiguration configuration,
        IResend resend,
        ILogger<AdminController> logger)
    {
        _context = context;
        _configuration = configuration;
        _resend = resend;
        _logger = logger;
    }

    // DTOs
    public class UserListDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? EmailVerifiedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class ActionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Get all users pending approval
    /// </summary>
    [HttpGet("pending-users")]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetPendingUsers()
    {
        var users = await _context.Users
            .Where(u => u.Status == "pending_approval")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Role = u.Role,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                EmailVerifiedAt = u.EmailVerifiedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetAllUsers()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Role = u.Role,
                Status = u.Status,
                CreatedAt = u.CreatedAt,
                EmailVerifiedAt = u.EmailVerifiedAt,
                ApprovedAt = u.ApprovedAt,
                ApprovedBy = u.ApprovedBy,
                LastLoginAt = u.LastLoginAt
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Approve a user
    /// </summary>
    [HttpPost("approve/{userId}")]
    public async Task<ActionResult<ActionResponse>> ApproveUser(string userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ActionResponse { Success = false, Message = "User not found" });
            }

            if (user.Status != "pending_approval")
            {
                return BadRequest(new ActionResponse { Success = false, Message = "User is not pending approval" });
            }

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            user.Status = "active";
            user.ApprovedBy = currentUserId;
            user.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send approval notification email
            await SendApprovalEmail(user, true);

            _logger.LogInformation("User {UserId} approved by {AdminId}", userId, currentUserId);

            return Ok(new ActionResponse { Success = true, Message = $"User {user.Name} has been approved" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to approve user {UserId}", userId);
            return StatusCode(500, new ActionResponse { Success = false, Message = "Failed to approve user" });
        }
    }

    /// <summary>
    /// Reject a user
    /// </summary>
    [HttpPost("reject/{userId}")]
    public async Task<ActionResult<ActionResponse>> RejectUser(string userId, [FromBody] RejectRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ActionResponse { Success = false, Message = "User not found" });
            }

            if (user.Status != "pending_approval")
            {
                return BadRequest(new ActionResponse { Success = false, Message = "User is not pending approval" });
            }

            user.Status = "rejected";
            user.RejectedReason = request.Reason;

            await _context.SaveChangesAsync();

            // Send rejection notification email
            await SendApprovalEmail(user, false, request.Reason);

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {UserId} rejected by {AdminId}", userId, currentUserId);

            return Ok(new ActionResponse { Success = true, Message = $"User {user.Name} has been rejected" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reject user {UserId}", userId);
            return StatusCode(500, new ActionResponse { Success = false, Message = "Failed to reject user" });
        }
    }

    /// <summary>
    /// Promote a user to Super Admin
    /// </summary>
    [HttpPost("promote/{userId}")]
    public async Task<ActionResult<ActionResponse>> PromoteToSuperAdmin(string userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ActionResponse { Success = false, Message = "User not found" });
            }

            if (user.Status != "active")
            {
                return BadRequest(new ActionResponse { Success = false, Message = "Only active users can be promoted" });
            }

            if (user.Role == "SuperAdmin")
            {
                return BadRequest(new ActionResponse { Success = false, Message = "User is already a Super Admin" });
            }

            user.Role = "SuperAdmin";
            await _context.SaveChangesAsync();

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {UserId} promoted to SuperAdmin by {AdminId}", userId, currentUserId);

            return Ok(new ActionResponse { Success = true, Message = $"User {user.Name} has been promoted to Super Admin" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to promote user {UserId}", userId);
            return StatusCode(500, new ActionResponse { Success = false, Message = "Failed to promote user" });
        }
    }

    /// <summary>
    /// Demote a Super Admin to Admin
    /// </summary>
    [HttpPost("demote/{userId}")]
    public async Task<ActionResult<ActionResponse>> DemoteToAdmin(string userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ActionResponse { Success = false, Message = "User not found" });
            }

            if (user.Role != "SuperAdmin")
            {
                return BadRequest(new ActionResponse { Success = false, Message = "User is not a Super Admin" });
            }

            // Prevent demoting yourself
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (user.Id == currentUserId)
            {
                return BadRequest(new ActionResponse { Success = false, Message = "You cannot demote yourself" });
            }

            user.Role = "Admin";
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} demoted to Admin by {AdminId}", userId, currentUserId);

            return Ok(new ActionResponse { Success = true, Message = $"User {user.Name} has been demoted to Admin" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to demote user {UserId}", userId);
            return StatusCode(500, new ActionResponse { Success = false, Message = "Failed to demote user" });
        }
    }

    private async Task SendApprovalEmail(User user, bool approved, string? reason = null)
    {
        try
        {
            var fromEmail = _configuration["Resend:FromEmail"] ?? "noreply@fourd.com.au";
            var fromName = _configuration["Resend:FromName"] ?? "Fourtify CRM";
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";

            string subject, body;
            if (approved)
            {
                subject = "Your Fourtify CRM Account Has Been Approved";
                body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h1 style='color: #00ff88;'>Account Approved!</h1>
                        <p>Hi {user.Name},</p>
                        <p>Great news! Your Fourtify CRM account has been approved by an administrator.</p>
                        <p>You can now log in and start using the CRM system:</p>
                        <p style='text-align: center; margin: 30px 0;'>
                            <a href='{frontendUrl}/crm' style='background-color: #00ff88; color: #0a0f1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;'>
                                Login to CRM
                            </a>
                        </p>
                        <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;' />
                        <p style='color: #888; font-size: 12px;'>This is an automated message from Fourtify CRM.</p>
                    </div>
                ";
            }
            else
            {
                subject = "Fourtify CRM Account Request Update";
                var reasonText = !string.IsNullOrEmpty(reason) ? $"<p><strong>Reason:</strong> {reason}</p>" : "";
                body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h1 style='color: #ef4444;'>Account Request Not Approved</h1>
                        <p>Hi {user.Name},</p>
                        <p>We regret to inform you that your Fourtify CRM account request has not been approved at this time.</p>
                        {reasonText}
                        <p>If you believe this is an error, please contact your system administrator.</p>
                        <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;' />
                        <p style='color: #888; font-size: 12px;'>This is an automated message from Fourtify CRM.</p>
                    </div>
                ";
            }

            var emailMessage = new EmailMessage
            {
                From = $"{fromName} <{fromEmail}>",
                To = { user.Email },
                Subject = subject,
                HtmlBody = body
            };

            await _resend.EmailSendAsync(emailMessage);
            _logger.LogInformation("Approval notification email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send approval email to {Email}", user.Email);
        }
    }
}
