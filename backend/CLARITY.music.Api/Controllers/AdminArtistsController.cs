

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
[Route("api/admin/artists")]
[Authorize(Policy = "AdminOnly")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class AdminArtistsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ILogger<AdminArtistsController> _logger;
    private readonly IArtistMutationService _artistMutations;
    private readonly IAdminArtistQueryService _artistQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminArtistsController(
        ILogger<AdminArtistsController> logger,
        IArtistMutationService artistMutations,
        IAdminArtistQueryService artistQueries)
    {
        
        _logger = logger;
        _artistMutations = artistMutations;
        _artistQueries = artistQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetAll([FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        
        var result = await _artistQueries.GetAllAsync(take, skip, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetById(int id)
    {
        
        var artist = await _artistQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        if (artist is null)
        {
            return NotFound(ApiErrorResponse.Create("Artist not found"));
        }

        return Ok(artist);
    }

    [EnableRateLimiting("admin-write")]
    [HttpPost]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Create([FromBody] AdminArtistSaveRequest request)
    {
        
        var result = await _artistMutations.CreateAsync(
            new ArtistMutationInput(
                request.Name,
                request.Slug,
                request.AvatarUrl,
                request.CoverUrl,
                request.OwnerUserId,
                ValidateOwnerUser: true),
            CancellationToken.None);

        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        _logger.LogInformation("ADMIN {Email} created artist {ArtistId} '{ArtistName}'", User.Identity?.Name ?? "unknown", result.Entity!.Id, result.Entity.Name);
        return Ok(await _artistQueries.GetByIdAsync(result.Entity.Id, HttpContext.RequestAborted));
    }

    [EnableRateLimiting("admin-write")]
    [HttpPut("{id:int}")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> Update(int id, [FromBody] AdminArtistSaveRequest request)
    {
        
        var result = await _artistMutations.UpdateAsync(
            id,
            new ArtistMutationInput(
                request.Name,
                request.Slug,
                request.AvatarUrl,
                request.CoverUrl,
                request.OwnerUserId,
                ValidateOwnerUser: true),
            CancellationToken.None);

        if (!result.Succeeded)
        {
            return ToActionResult(result.Error!);
        }

        _logger.LogInformation("ADMIN {Email} updated artist {ArtistId} '{ArtistName}'", User.Identity?.Name ?? "unknown", result.Entity!.Id, result.Entity.Name);
        return Ok(await _artistQueries.GetByIdAsync(result.Entity.Id, HttpContext.RequestAborted));
    }

    [EnableRateLimiting("admin-write")]
    [HttpDelete("{id:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> Delete(int id)
    {
        
        var artistName = await _artistQueries.GetNameAsync(id, HttpContext.RequestAborted);
        var result = await _artistMutations.DeleteAsync(id, CancellationToken.None);
        if (result.StatusCode >= 400)
        {
            return ToActionResult(result);
        }

        _logger.LogInformation("ADMIN {Email} deleted artist {ArtistId} '{ArtistName}'", User.Identity?.Name ?? "unknown", id, artistName ?? "unknown");
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
