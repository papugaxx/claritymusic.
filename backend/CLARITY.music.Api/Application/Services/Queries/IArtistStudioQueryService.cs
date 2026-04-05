

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistStudioQueryService
{
    Task<ArtistPublicDto?> GetOwnedArtistAsync(string userId, CancellationToken cancellationToken = default);
    Task<PagedResultDto<TrackDto>> GetTracksAsync(int artistId, int take, int skip, CancellationToken cancellationToken = default);
}
