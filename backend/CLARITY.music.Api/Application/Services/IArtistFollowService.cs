

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistFollowService
{
    Task<ServiceResult> FollowAsync(int artistId, string userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> UnfollowAsync(int artistId, string userId, CancellationToken cancellationToken = default);
}
