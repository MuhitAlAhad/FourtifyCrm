using Microsoft.AspNetCore.Mvc;
using CRM.API.Services;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;
    private readonly IActivityService _activityService;

    public StatsController(IStatsService statsService, IActivityService activityService)
    {
        _statsService = statsService;
        _activityService = activityService;
    }

    [HttpGet]
    public async Task<ActionResult> GetDashboardStats()
    {
        var stats = await _statsService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("activities")]
    public async Task<ActionResult> GetRecentActivities([FromQuery] int limit = 20)
    {
        var activities = await _activityService.GetAllAsync(limit);
        return Ok(new { activities });
    }
}
