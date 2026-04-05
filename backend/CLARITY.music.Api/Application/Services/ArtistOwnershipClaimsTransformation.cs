

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public class ArtistOwnershipClaimsTransformation : IClaimsTransformation
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IArtistOwnershipService _artistOwnership;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistOwnershipClaimsTransformation(IArtistOwnershipService artistOwnership)
    {
        
        _artistOwnership = artistOwnership;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated)
            return principal;

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return principal;

        var existing = principal.FindFirst(AppClaimTypes.ArtistId)?.Value;
        if (int.TryParse(existing, out var artistIdFromClaim) && artistIdFromClaim > 0)
            return principal;

        var ownedArtistId = await _artistOwnership.GetOwnedArtistIdAsync(userId);
        if (!ownedArtistId.HasValue || ownedArtistId.Value <= 0)
            return principal;

        identity.AddClaim(new Claim(AppClaimTypes.ArtistId, ownedArtistId.Value.ToString()));
        return principal;
    }
}
