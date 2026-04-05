

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/uploads")]
[Authorize]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class UploadsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IManagedUploadService _uploads;
    private readonly ICurrentUserService _currentUser;

    // Коментар коротко пояснює призначення наступного фрагмента
    public UploadsController(IManagedUploadService uploads, ICurrentUserService currentUser)
    {
        
        _uploads = uploads;
        _currentUser = currentUser;
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(5_000_000)]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        var result = await _uploads.UploadAvatarAsync(file, ResolveUserIdOrNull(), CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpPost("cover")]
    [RequestSizeLimit(8_000_000)]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> UploadCover([FromForm] IFormFile file)
    {
        var result = await _uploads.UploadCoverAsync(file, ResolveUserIdOrNull(), CancellationToken.None);
        return ToActionResult(result);
    }

    [Authorize(Roles = "Artist,Admin")]
    [HttpPost("audio")]
    [RequestSizeLimit(25_000_000)]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> UploadAudio([FromForm] IFormFile file)
    {
        var result = await _uploads.UploadAudioAsync(file, ResolveUserIdOrNull(), CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpDelete]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> DeleteUploadedFile([FromQuery] string? url, CancellationToken cancellationToken)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _uploads.DeleteAsync(url, userId, User.IsInRole("Admin"), CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private string? ResolveUserIdOrNull()
    {
        
        return _currentUser.TryGetUserId(out var userId) ? userId : null;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
