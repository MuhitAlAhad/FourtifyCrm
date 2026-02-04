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
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { message = "Proxy upload failed." });
            }

            var json = await response.Content.ReadAsStringAsync();
            return Content(json, "application/json");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new HashSet<string> { ".png", ".jpg", ".jpeg", ".gif", ".webp" };
        if (!allowed.Contains(ext))
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

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadRoot, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var configuredBaseUrl = _configuration["PublicBaseUrl"]
            ?? Environment.GetEnvironmentVariable("PUBLIC_BASE_URL");
        var baseUrl = !string.IsNullOrWhiteSpace(configuredBaseUrl)
            ? configuredBaseUrl.TrimEnd('/')
            : $"{Request.Scheme}://{Request.Host}";
        var url = $"{baseUrl}/uploads/{fileName}";

        return Ok(new { url });
    }
}
