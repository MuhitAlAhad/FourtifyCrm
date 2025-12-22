using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CRM.API.Data;
using CRM.API.Models;
using Resend;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IResend _resend;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        CrmDbContext context,
        IConfiguration configuration,
        IResend resend,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _resend = resend;
        _logger = logger;
    }

    // DTO Classes
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public UserDto? User { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Register a new admin account
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Name) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Email, name, and password are required" });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Password must be at least 8 characters" });
            }

            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (existingUser != null)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "An account with this email already exists" });
            }

            // Create verification token
            var verificationToken = Guid.NewGuid().ToString("N");

            // Create user
            var user = new User
            {
                Id = $"user:{Guid.NewGuid()}",
                Email = request.Email.ToLower().Trim(),
                Name = request.Name.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "Admin",
                Status = "pending_verification",
                EmailVerificationToken = verificationToken,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send verification email
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var verifyUrl = $"{frontendUrl}/verify-email?token={verificationToken}";
            
            var fromEmail = _configuration["Resend:FromEmail"] ?? "noreply@fourd.com.au";
            var fromName = _configuration["Resend:FromName"] ?? "Fourtify CRM";

            try
            {
                var emailMessage = new EmailMessage
                {
                    From = $"{fromName} <{fromEmail}>",
                    To = { request.Email },
                    Subject = "Verify Your Fourtify CRM Account",
                    HtmlBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <h1 style='color: #00ff88;'>Welcome to Fourtify CRM</h1>
                            <p>Hi {user.Name},</p>
                            <p>Thank you for registering. Please click the button below to verify your email address:</p>
                            <p style='text-align: center; margin: 30px 0;'>
                                <a href='{verifyUrl}' style='background-color: #00ff88; color: #0a0f1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;'>
                                    Verify Email Address
                                </a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style='word-break: break-all; color: #666;'>{verifyUrl}</p>
                            <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;' />
                            <p style='color: #888; font-size: 12px;'>This is an automated message from Fourtify CRM. Please do not reply.</p>
                        </div>
                    "
                };

                await _resend.EmailSendAsync(emailMessage);
                _logger.LogInformation("Verification email sent to {Email}", request.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}", request.Email);
                // Don't fail registration if email fails - they can request resend
            }

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Registration successful! Please check your email to verify your account."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for {Email}", request.Email);
            return StatusCode(500, new AuthResponse { Success = false, Message = "Registration failed. Please try again." });
        }
    }

    /// <summary>
    /// Verify email address
    /// </summary>
    [HttpGet("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail([FromQuery] string token)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Verification token is required" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
            if (user == null)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Invalid or expired verification token" });
            }

            if (user.Status != "pending_verification")
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Email has already been verified" });
            }

            // Update user status
            user.Status = "pending_approval";
            user.EmailVerifiedAt = DateTime.UtcNow;
            user.EmailVerificationToken = null; // Clear token after use

            await _context.SaveChangesAsync();

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Email verified successfully! Your account is now pending admin approval."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email verification failed for token {Token}", token);
            return StatusCode(500, new AuthResponse { Success = false, Message = "Verification failed. Please try again." });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Email and password are required" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower().Trim());
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new AuthResponse { Success = false, Message = "Invalid email or password" });
            }

            // Check user status
            switch (user.Status)
            {
                case "pending_verification":
                    return Unauthorized(new AuthResponse 
                    { 
                        Success = false, 
                        Message = "Please verify your email address first. Check your inbox for the verification link." 
                    });
                
                case "pending_approval":
                    return Unauthorized(new AuthResponse 
                    { 
                        Success = false, 
                        Message = "Your account is pending admin approval. You will receive an email once approved." 
                    });
                
                case "rejected":
                    var reason = !string.IsNullOrEmpty(user.RejectedReason) ? $" Reason: {user.RejectedReason}" : "";
                    return Unauthorized(new AuthResponse 
                    { 
                        Success = false, 
                        Message = $"Your account has been rejected.{reason}" 
                    });
                
                case "active":
                    // Proceed with login
                    break;
                
                default:
                    return Unauthorized(new AuthResponse { Success = false, Message = "Account status is invalid" });
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role,
                    Status = user.Status
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for {Email}", request.Email);
            return StatusCode(500, new AuthResponse { Success = false, Message = "Login failed. Please try again." });
        }
    }

    /// <summary>
    /// Get current user from JWT token
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponse>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new AuthResponse { Success = false, Message = "Not authenticated" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new AuthResponse { Success = false, Message = "User not found" });
            }

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "User retrieved",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role,
                    Status = user.Status
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current user");
            return StatusCode(500, new AuthResponse { Success = false, Message = "Failed to retrieve user" });
        }
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "FourtifyCRM-SuperSecure-JWT-Key-2024-DefenceGrade";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "FourtifyCRM";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "FourtifyCRM-Users";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("status", user.Status)
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
