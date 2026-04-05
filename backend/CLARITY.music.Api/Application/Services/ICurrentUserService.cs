

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ICurrentUserService
{
    bool TryGetUserId(out string userId);
    string RequireUserId();
    bool IsAdmin();
    bool IsArtist();
    Task<int?> GetOwnedArtistIdAsync(CancellationToken cancellationToken = default);
    Task<bool> OwnsArtistAsync(int artistId, CancellationToken cancellationToken = default);
}
