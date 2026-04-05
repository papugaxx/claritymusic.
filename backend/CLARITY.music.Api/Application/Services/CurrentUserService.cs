

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class CurrentUserService : ICurrentUserService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IHttpContextAccessor _http;
    private readonly IArtistOwnershipService _artistOwnership;

    // Коментар коротко пояснює призначення наступного фрагмента
    public CurrentUserService(IHttpContextAccessor http, IArtistOwnershipService artistOwnership)
    {
        
        _http = http;
        _artistOwnership = artistOwnership;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool TryGetUserId(out string userId)
    {
        userId = string.Empty;

        var user = _http.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        userId = value;
        return true;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public string RequireUserId()
    {
        if (!TryGetUserId(out var userId))
        {
            throw new UnauthorizedAccessException("Not authenticated");
        }

        return userId;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool IsAdmin() => RequireUser().IsInRole("Admin");

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool IsArtist() => RequireUser().IsInRole("Artist");

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<int?> GetOwnedArtistIdAsync(CancellationToken cancellationToken = default)
    {
        var user = RequireUser();

        var claimValue = user.FindFirstValue(AppClaimTypes.ArtistId);
        if (int.TryParse(claimValue, out var artistId) && artistId > 0)
        {
            return artistId;
        }

        return await _artistOwnership.GetOwnedArtistIdAsync(RequireUserId(), cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<bool> OwnsArtistAsync(int artistId, CancellationToken cancellationToken = default)
    {
        if (artistId <= 0)
        {
            return false;
        }

        var ownedArtistId = await GetOwnedArtistIdAsync(cancellationToken);
        return ownedArtistId.HasValue && ownedArtistId.Value == artistId;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private ClaimsPrincipal RequireUser()
    {
        var user = _http.HttpContext?.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("Not authenticated");
        }

        return user;
    }
}
