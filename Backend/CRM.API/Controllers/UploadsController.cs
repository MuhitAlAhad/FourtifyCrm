using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/uploads")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public UploadsController(IWebHostEnvironment env, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _env = env;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        var supabaseUrl = _configuration["Supabase:Url"];
        var supabaseKey = _configuration["Supabase:ApiKey"];

        if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(supabaseKey))
        {
            try
            {
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var fileName = $"{Guid.NewGuid()}{ext}";
                var bucket = "signatures"; // Ensure this bucket exists and is public
                
                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseKey}");
                client.DefaultRequestHeaders.Add("apikey", supabaseKey);

                using var content = new StreamContent(file.OpenReadStream());
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);

                var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucket}/{fileName}";
                
                // Supabase requires a POST to create objects
                var response = await client.PostAsync($"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucket}/{fileName}", content);
                
                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { url = uploadUrl });
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    // Fallback to local if Supabase fails (optional)
                }
            }
            catch (Exception)
            {
                // Fallback to local
            }
        }

        // --- FALLBACK TO LOCAL STORAGE (Original Logic) ---
        var proxyUrl = _configuration["UploadProxyUrl"]
            ?? Environment.GetEnvironmentVariable("UPLOAD_PROXY_URL");
        if (!string.IsNullOrWhiteSpace(proxyUrl))
        {
            using var client = _httpClientFactory.CreateClient();
            using var content = new MultipartFormDataContent();
            await using var stream = file.OpenReadStream();
            var fileContent = new StreamContent(stream);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
            content.Add(fileContent, "file", file.FileName);

            var response = await client.PostAsync(proxyUrl, content);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return Content(json, "application/json");
            }
        }

        var extLocal = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new HashSet<string> { ".png", ".jpg", ".jpeg", ".gif", ".webp" };
        if (!allowed.Contains(extLocal))
        {
            return BadRequest(new { message = "Unsupported file type." });
        }

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadRoot = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadRoot);

        var fileNameLocal = $"{Guid.NewGuid()}{extLocal}";
        var filePathLocal = Path.Combine(uploadRoot, fileNameLocal);

        await using (var streamLocal = System.IO.File.Create(filePathLocal))
        {
            await file.CopyToAsync(streamLocal);
        }

        var configuredBaseUrl = _configuration["PublicBaseUrl"]
            ?? Environment.GetEnvironmentVariable("PUBLIC_BASE_URL");
        var baseUrl = !string.IsNullOrWhiteSpace(configuredBaseUrl)
            ? configuredBaseUrl.TrimEnd('/')
            : $"{Request.Scheme}://{Request.Host}";
        var url = $"{baseUrl}/uploads/{fileNameLocal}";

        return Ok(new { url });
    }
}
