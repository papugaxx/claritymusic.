

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[Authorize(Roles = "Artist")]
[ApiController]
[Route("api/artist/me")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class ArtistStudioController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ICurrentUserService _currentUser;
    private readonly IArtistMutationService _artistMutations;
    private readonly ITrackMutationService _trackMutations;
    private readonly IArtistStudioQueryService _artistStudioQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistStudioController(
        ICurrentUserService currentUser,
        IArtistMutationService artistMutations,
        ITrackMutationService trackMutations,
        IArtistStudioQueryService artistStudioQueries)
    {
        
        _currentUser = currentUser;
        _artistMutations = artistMutations;
        _trackMutations = trackMutations;
        _artistStudioQueries = artistStudioQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetMyArtist()
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var artist = await _artistStudioQueries.GetOwnedArtistAsync(userId, HttpContext.RequestAborted);
        if (artist is null)
        {
            return NotFound(ApiErrorResponse.Create("Artist profile is not configured yet"));
        }

        return Ok(artist);
    }

    [EnableRateLimiting("write")]
    [HttpPost]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> UpsertMyArtist([FromBody] ArtistProfileSaveRequest request)
    {
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var existing = await _artistStudioQueries.GetOwnedArtistAsync(userId, HttpContext.RequestAborted);
        var mutationInput = new ArtistMutationInput(
            request.Name,
            request.Slug,
            request.AvatarUrl,
            request.CoverUrl,
            OwnerUserId: userId,
            ValidateOwnerUser: false);

        var result = existing is null
            ? await _artistMutations.CreateAsync(mutationInput, CancellationToken.None)
            : await _artistMutations.UpdateAsync(existing.Id, mutationInput, CancellationToken.None);

        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        return Ok(await _artistStudioQueries.GetOwnedArtistAsync(userId, HttpContext.RequestAborted));
    }

    [HttpGet("tracks")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetMyTracks([FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        
        var contextResult = await ResolveArtistContextAsync();
        if (contextResult.Error is not null)
        {
            return contextResult.Error;
        }

        var result = await _artistStudioQueries.GetTracksAsync(contextResult.ArtistId, take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }

    [EnableRateLimiting("write")]
    [HttpPost("tracks")]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> CreateTrack([FromBody] ArtistTrackSaveRequest request)
    {
        
        var contextResult = await ResolveArtistContextAsync();
        if (contextResult.Error is not null)
        {
            return contextResult.Error;
        }

        var result = await _trackMutations.CreateArtistAsync(contextResult.ArtistId, request, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpPatch("tracks/{id:int}/status")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> PatchTrackStatus(int id, [FromBody] TrackStatusUpdateRequest request)
    {
        var contextResult = await ResolveArtistContextAsync();
        if (contextResult.Error is not null)
        {
            return contextResult.Error;
        }

        var result = await _trackMutations.SetArtistStatusAsync(id, contextResult.ArtistId, request.IsActive, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpPut("tracks/{id:int}")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> UpdateTrack(int id, [FromBody] ArtistTrackSaveRequest request)
    {
        
        var contextResult = await ResolveArtistContextAsync();
        if (contextResult.Error is not null)
        {
            return contextResult.Error;
        }

        var result = await _trackMutations.UpdateArtistAsync(id, contextResult.ArtistId, request, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("write")]
    [HttpDelete("tracks/{id:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> DeleteTrack(int id)
    {
        
        var contextResult = await ResolveArtistContextAsync();
        if (contextResult.Error is not null)
        {
            return contextResult.Error;
        }

        var result = await _trackMutations.DeleteArtistAsync(id, contextResult.ArtistId, CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task<ArtistContextResult> ResolveArtistContextAsync()
    {
        
        if (!_currentUser.TryGetUserId(out var userId))
        {
            return new ArtistContextResult(0, Unauthorized(ApiErrorResponse.Create("Authentication required")));
        }

        var ownedArtistId = await _currentUser.GetOwnedArtistIdAsync(HttpContext.RequestAborted);
        if (!ownedArtistId.HasValue)
        {
            return new ArtistContextResult(0, NotFound(ApiErrorResponse.Create("Artist profile is not configured yet")));
        }

        return new ArtistContextResult(ownedArtistId.Value, null);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }

    // Record нижче задає компактну форму даних для передачі між шарами
    private sealed record ArtistContextResult(int ArtistId, IActionResult? Error);
}
