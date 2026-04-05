

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Playback;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/tracks")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class TracksController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ITrackQueryService _trackQueries;
    private readonly ICurrentUserService _currentUser;
    private readonly ITrackPlayService _trackPlayService;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TracksController(
        ITrackQueryService trackQueries,
        ICurrentUserService currentUser,
        ITrackPlayService trackPlayService)
    {
        
        _trackQueries = trackQueries;
        _currentUser = currentUser;
        _trackPlayService = trackPlayService;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? search,
        [FromQuery] int? genreId,
        [FromQuery] int? moodId,
        [FromQuery] string? sort,
        [FromQuery] int take = 100,
        [FromQuery] int skip = 0)
    {
        
        var result = await _trackQueries.GetAllAsync(
            q,
            search,
            genreId,
            moodId,
            sort,
            take,
            skip,
            HttpContext.RequestAborted);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetById(int id)
    {
        
        var track = await _trackQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        return track is null
            ? NotFound()
            : Ok(track);
    }

    [Authorize]
    [EnableRateLimiting("write")]
    [HttpPost("{id:int}/play")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Play(int id)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _trackPlayService.RecordPlayAsync(id, userId, User.Identity?.Name, CancellationToken.None);
        return StatusCode(result.StatusCode, result.Payload);
    }
}
