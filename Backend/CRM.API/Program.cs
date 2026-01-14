using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CRM.API.Data;
using CRM.API.Services;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Amazon.SimpleEmailV2;
using Amazon.SimpleNotificationService;
using Hangfire;
using Hangfire.PostgreSql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Enable response compression (GZIP + Brotli)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

// Configure PostgreSQL with Supabase
// Render uses DATABASE_URL env var, local dev uses appsettings
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
    ?? builder.Configuration.GetConnectionString("SupabaseConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string not found. Set DATABASE_URL environment variable or configure ConnectionStrings:SupabaseConnection in appsettings.");
}

builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register CRM services
builder.Services.AddScoped<IOrganisationService, OrganisationService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IStatsService, StatsService>();

// Register Resend email service
var resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") 
    ?? builder.Configuration["Resend:ApiKey"] ?? "";
builder.Services.AddOptions();
builder.Services.AddHttpClient<Resend.ResendClient>();
builder.Services.Configure<Resend.ResendClientOptions>(o =>
{
    o.ApiToken = resendApiKey;
});
builder.Services.AddTransient<Resend.IResend, Resend.ResendClient>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Bind SES settings
builder.Services.Configure<SesSettings>(
    builder.Configuration.GetSection("SesSettings"));

// Register email service
builder.Services.AddScoped<ISesEmailService, SesEmailService>();

// AWS
//builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
//builder.Services.AddAWSService<IAmazonSimpleEmailService>();

// ASW SES2
//builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
//builder.Services.AddAWSService<IAmazonSimpleEmailServiceV2>();
//builder.Services.AddAWSService<IAmazonSimpleNotificationService>();

// Hangfire
//builder.Services.AddHangfire(config =>
//    config.UsePostgreSqlStorage(
//        builder.Configuration.GetConnectionString(connectionString),
//        new PostgreSqlStorageOptions
//        {
//            SchemaName = "hangfire"
//        }
//    )
//);

//builder.Services.AddHangfireServer();

// Configure CORS for frontend (supports both dev and production)
var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL");
var allowedOrigins = new List<string>
{
    "http://localhost:3000",
    "http://localhost:5173",
    "https://localhost:3000",
    "https://crm.fourd.com.au"
};
if (!string.IsNullOrEmpty(frontendUrl) && !allowedOrigins.Contains(frontendUrl))
{
    allowedOrigins.Add(frontendUrl);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "FourtifyCRM-SuperSecure-JWT-Key-2024-DefenceGrade";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "FourtifyCRM";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "FourtifyCRM-Users";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "CRM API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use response compression EARLY in the pipeline
app.UseResponseCompression();

// Use CORS before other middleware
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-migrate database (run in both dev and production for simplicity)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
    db.Database.Migrate();
    
    // Seed first Super Admin if no users exist
    if (!db.Users.Any())
    {
        var superAdmin = new CRM.API.Models.User
        {
            Id = $"user:{Guid.NewGuid()}",
            Email = "dani@fourd.com.au",
            Name = "Danielle Mako",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "SuperAdmin",
            Status = "active",
            EmailVerifiedAt = DateTime.UtcNow,
            ApprovedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(superAdmin);
        db.SaveChanges();
        Console.WriteLine("✅ Super Admin created: dani@fourd.com.au (password: Admin@123)");
    }
}

app.Run();

