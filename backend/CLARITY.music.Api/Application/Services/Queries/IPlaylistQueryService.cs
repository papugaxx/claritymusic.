

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IPlaylistQueryService
{
    Task<PagedResultDto<PlaylistSummaryDto>> GetMineAsync(string userId, int take, int skip, CancellationToken cancellationToken = default);
    Task<PlaylistDetailsDto?> GetOwnedDetailsAsync(string userId, int playlistId, int take, int skip, string? sort, CancellationToken cancellationToken = default);
}
