using CRM.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers
{
    public interface ILeadsController
    {
        Task<ActionResult<Lead>> Create([FromBody] Lead lead);
        Task<ActionResult> Delete(string id);
        Task<ActionResult> DeleteAll();
        Task<ActionResult> GetAll([FromQuery] string? stage = null);
        Task<ActionResult<Lead>> GetById(string id);
        Task<ActionResult<Lead>> Update(string id, [FromBody] Lead lead);
        Task<ActionResult> UpdateStage(string id, [FromBody] UpdateStageRequest request);
    }
}