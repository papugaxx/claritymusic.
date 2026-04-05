

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/playlists")]
[Authorize]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class PlaylistsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ICurrentUserService _currentUser;
    private readonly IPlaylistMutationService _playlistMutations;
    private readonly IPlaylistQueryService _playlistQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public PlaylistsController(
        ICurrentUserService currentUser,
        IPlaylistMutationService playlistMutations,
        IPlaylistQueryService playlistQueries)
    {
        
        _currentUser = currentUser;
        _playlistMutations = playlistMutations;
        _playlistQueries = playlistQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetMyPlaylists([FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistQueries.GetMineAsync(userId, take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePlaylistRequest request)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.UpdateAsync(id, userId, request, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpPost]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Create([FromBody] CreatePlaylistRequest request)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.CreateAsync(userId, User.Identity?.Name, request, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> Delete(int id)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.DeleteAsync(id, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpGet("{id:int}")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetDetails(int id, [FromQuery] int take = 200, [FromQuery] int skip = 0, [FromQuery] string? sort = null)
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var playlist = await _playlistQueries.GetOwnedDetailsAsync(userId, id, take, skip, sort, HttpContext.RequestAborted);
        if (playlist is null)
        {
            return NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        return Ok(playlist);
    }

    [HttpGet("{id:int}/tracks/{trackId:int}/exists")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> HasTrack(int id, int trackId)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.HasTrackAsync(id, trackId, userId, HttpContext.RequestAborted);
        return ToActionResult(result);
    }

    [HttpPost("{id:int}/tracks/{trackId:int}")]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> AddTrack(int id, int trackId)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.AddTrackAsync(id, trackId, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}/tracks/{trackId:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> RemoveTrack(int id, int trackId)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.RemoveTrackAsync(id, trackId, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpPost("{id:int}/cover")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> UploadCover(int id, IFormFile file)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.UploadCoverAsync(id, userId, file, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}/cover")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> RemoveCover(int id)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _playlistMutations.RemoveCoverAsync(id, userId, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
