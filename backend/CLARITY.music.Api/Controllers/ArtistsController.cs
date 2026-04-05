

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
[Route("api/[controller]")]



// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class ArtistsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IArtistQueryService _artistQueries;
    private readonly ICurrentUserService _currentUser;
    private readonly IArtistFollowService _artistFollows;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistsController(
        IArtistQueryService artistQueries,
        ICurrentUserService currentUser,
        IArtistFollowService artistFollows)
    {
        
        _artistQueries = artistQueries;
        _currentUser = currentUser;
        _artistFollows = artistFollows;
    }

    [HttpGet]
    [AllowAnonymous]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetArtists([FromQuery] string? q = null, [FromQuery] string? search = null, [FromQuery] int take = 50, [FromQuery] int skip = 0)
    {
        
        var items = await _artistQueries.GetArtistsAsync(q, search, take, skip, HttpContext.RequestAborted);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetArtist(int id)
    {
        var currentUserId = _currentUser.TryGetUserId(out var userId) ? userId : null;
        var artist = await _artistQueries.GetArtistAsync(id, currentUserId, HttpContext.RequestAborted);

        if (artist is null)
        {
            return NotFound(ApiErrorResponse.Create("Artist not found"));
        }

        return Ok(artist);
    }

    [HttpGet("{id:int}/tracks")]
    [AllowAnonymous]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetArtistTracks(int id, [FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        
        var result = await _artistQueries.GetArtistTracksAsync(id, take, skip, HttpContext.RequestAborted);
        return result is null
            ? NotFound(ApiErrorResponse.Create("Artist not found"))
            : Ok(result);
    }

    [EnableRateLimiting("write")]
    [HttpPost("{id:int}/follow")]
    [Authorize]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Follow(int id)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _artistFollows.FollowAsync(id, userId, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpDelete("{id:int}/follow")]
    [Authorize]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Unfollow(int id)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _artistFollows.UnfollowAsync(id, userId, CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
