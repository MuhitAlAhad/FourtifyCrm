using Microsoft.AspNetCore.Mvc;
using CRM.API.Models;
using CRM.API.Services;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _service;

    public LeadsController(ILeadService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? stage = null)
    {
        var leads = await _service.GetAllAsync(stage);
        return Ok(new { leads });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Lead>> GetById(string id)
    {
        var lead = await _service.GetByIdAsync(id);
        if (lead == null) return NotFound();
        return Ok(lead);
    }

    [HttpPost]
    public async Task<ActionResult<Lead>> Create([FromBody] Lead lead)
    {
        var created = await _service.CreateAsync(lead);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Lead>> Update(string id, [FromBody] Lead lead)
    {
        var updated = await _service.UpdateAsync(id, lead);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpPatch("{id}/stage")]
    public async Task<ActionResult> UpdateStage(string id, [FromBody] UpdateStageRequest request)
    {
        var lead = await _service.UpdateStageAsync(id, request.Stage);
        if (lead == null) return NotFound();
        return Ok(lead);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult> DeleteAll()
    {
        await _service.DeleteAllAsync();
        return NoContent();
    }
}

public class UpdateStageRequest
{
    public string Stage { get; set; } = string.Empty;
}
