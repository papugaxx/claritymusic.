

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Profile;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/me/profile")]
[Authorize]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class MeProfileController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ICurrentUserService _currentUser;
    private readonly IUserProfileService _userProfiles;

    // Коментар коротко пояснює призначення наступного фрагмента
    public MeProfileController(ICurrentUserService currentUser, IUserProfileService userProfiles)
    {
        
        _currentUser = currentUser;
        _userProfiles = userProfiles;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> Get()
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var profile = await _userProfiles.GetAsync(userId, User.Identity?.Name, HttpContext.RequestAborted);
        return Ok(profile);
    }

    [EnableRateLimiting("write")]
    [HttpPut]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> Update([FromBody] MeProfileUpdateRequest request)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _userProfiles.UpdateAsync(userId, User.Identity?.Name, request, CancellationToken.None);
        return StatusCode(result.StatusCode, result.Payload);
    }
}
