

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IMeQueryService
{
    Task<IReadOnlyList<TrackDto>> GetRecentAsync(string userId, int take, CancellationToken cancellationToken = default);
    Task<PagedResultDto<FollowingArtistDto>> GetFollowingAsync(string userId, int take, int skip, CancellationToken cancellationToken = default);
}
