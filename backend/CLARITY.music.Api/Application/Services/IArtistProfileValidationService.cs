

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistProfileValidationService
{
    Task<ArtistProfileValidationResult> ValidateAsync(
        string? name,
        string? slug,
        string? avatarUrl,
        string? coverUrl,
        int? currentArtistId,
        string? ownerUserId = null,
        bool validateOwnerUser = false,
        CancellationToken cancellationToken = default);
}
