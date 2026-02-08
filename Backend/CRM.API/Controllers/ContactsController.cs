using Microsoft.AspNetCore.Mvc;
using CRM.API.Models;
using CRM.API.Services;

namespace CRM.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _service;

    public ContactsController(IContactService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? organisationId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var contactsQuery = await _service.GetAllAsync(organisationId, search);
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(status))
        {
            contactsQuery = contactsQuery.Where(c => c.Status == status.ToLower());
        }
        
        var contacts = contactsQuery.ToList();
        return Ok(new { contacts });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Contact>> GetById(string id)
    {
        var contact = await _service.GetByIdAsync(id);
        if (contact == null) return NotFound();
        return Ok(contact);
    }

    [HttpPost]
    public async Task<ActionResult<Contact>> Create([FromBody] Contact contact)
    {
        var created = await _service.CreateAsync(contact);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Contact>> Update(string id, [FromBody] Contact contact)
    {
        var updated = await _service.UpdateAsync(id, contact);
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

    [HttpGet("{id}/activities")]
    public async Task<ActionResult> GetActivities(string id)
    {
        var activities = await _service.GetActivitiesAsync(id);
        return Ok(new { activities });
    }
}
