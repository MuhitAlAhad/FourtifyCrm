using Microsoft.AspNetCore.Mvc;
using CRM.API.Models;
using CRM.API.Services;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganisationsController : ControllerBase
{
    private readonly IOrganisationService _service;

    public OrganisationsController(IOrganisationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? search = null)
    {
        var organisations = await _service.GetAllAsync(search);
        return Ok(new { organisations });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Organisation>> GetById(string id)
    {
        var org = await _service.GetByIdAsync(id);
        if (org == null) return NotFound();
        return Ok(org);
    }

    [HttpPost]
    public async Task<ActionResult<Organisation>> Create([FromBody] Organisation organisation)
    {
        var created = await _service.CreateAsync(organisation);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Organisation>> Update(string id, [FromBody] Organisation organisation)
    {
        var updated = await _service.UpdateAsync(id, organisation);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
