

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/admin/tracks")]
[Authorize(Policy = "AdminOnly")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class AdminTracksController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ITrackMutationService _trackMutations;
    private readonly IAdminTrackQueryService _trackQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminTracksController(ITrackMutationService trackMutations, IAdminTrackQueryService trackQueries)
    {
        
        _trackMutations = trackMutations;
        _trackQueries = trackQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetAll(
        [FromQuery] bool activeOnly = false,
        [FromQuery] string? q = null,
        [FromQuery] string? sort = null,
        [FromQuery] int take = 100,
        [FromQuery] int skip = 0)
    {
        
        var result = await _trackQueries.GetAllAsync(activeOnly, q, sort, take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetById(int id)
    {
        
        var track = await _trackQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        if (track is null)
        {
            return NotFound(ApiErrorResponse.Create("Track not found"));
        }

        return Ok(track);
    }

    [EnableRateLimiting("admin-write")]
    [HttpPost]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Create([FromBody] AdminTrackSaveRequest request)
    {
        
        var result = await _trackMutations.CreateAdminAsync(request, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("admin-write")]
    [HttpPut("{id:int}")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> Update(int id, [FromBody] AdminTrackSaveRequest request)
    {
        
        var result = await _trackMutations.UpdateAdminAsync(id, request, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("admin-write")]
    [HttpPatch("{id:int}/status")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> SetStatus(int id, [FromBody] TrackStatusUpdateRequest request)
    {
        var result = await _trackMutations.SetAdminStatusAsync(id, request.IsActive, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("admin-write")]
    [HttpDelete("{id:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> Delete(int id)
    {
        
        var result = await _trackMutations.DeleteAdminAsync(id, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
