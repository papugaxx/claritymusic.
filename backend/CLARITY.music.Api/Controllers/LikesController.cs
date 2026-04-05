

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
[Route("api/likes")]
[Authorize]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class LikesController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ICurrentUserService _currentUser;
    private readonly ILikeMutationService _likeMutations;
    private readonly ILikeQueryService _likeQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LikesController(
        ICurrentUserService currentUser,
        ILikeMutationService likeMutations,
        ILikeQueryService likeQueries)
    {
        
        _currentUser = currentUser;
        _likeMutations = likeMutations;
        _likeQueries = likeQueries;
    }

    [EnableRateLimiting("write")]
    [HttpPost("toggle/{trackId:int}")]
    [HttpPost("{trackId:int}")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Toggle(int trackId)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _likeMutations.ToggleAsync(trackId, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpPut("{trackId:int}")]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Add(int trackId)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _likeMutations.AddAsync(trackId, userId, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpDelete("{trackId:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> Remove(int trackId)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _likeMutations.RemoveAsync(trackId, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpGet("ids")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetIds()
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var ids = await _likeQueries.GetIdsAsync(userId, HttpContext.RequestAborted);
        return Ok(ids);
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetLiked([FromQuery] int take = 200, [FromQuery] int skip = 0)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _likeQueries.GetLikedAsync(userId, take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
