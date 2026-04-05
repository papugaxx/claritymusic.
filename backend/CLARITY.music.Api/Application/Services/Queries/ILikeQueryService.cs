

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ILikeQueryService
{
    Task<IReadOnlyList<int>> GetIdsAsync(string userId, CancellationToken cancellationToken = default);
    Task<PagedResultDto<LikedTrackListItemDto>> GetLikedAsync(string userId, int take, int skip, CancellationToken cancellationToken = default);
}
