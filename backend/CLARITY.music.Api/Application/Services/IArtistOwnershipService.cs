

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistOwnershipService
{
    Task<int?> GetOwnedArtistIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<string?> GetOwnerUserIdAsync(int artistId, CancellationToken cancellationToken = default);
    Task<bool> IsOwnerAsync(string userId, int artistId, CancellationToken cancellationToken = default);
    Task SetOwnerAsync(int artistId, string? ownerUserId, CancellationToken cancellationToken = default);
    Task SyncArtistRoleAsync(string userId, CancellationToken cancellationToken = default);
}
