

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/me")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class MeController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ICurrentUserService _currentUser;
    private readonly IMeQueryService _meQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public MeController(ICurrentUserService currentUser, IMeQueryService meQueries)
    {
        
        _currentUser = currentUser;
        _meQueries = meQueries;
    }

    [Authorize]
    [HttpGet("recent")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Recent([FromQuery] int take = 12)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _meQueries.GetRecentAsync(userId, take, HttpContext.RequestAborted);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("following")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetFollowing([FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _meQueries.GetFollowingAsync(userId, take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }
}
