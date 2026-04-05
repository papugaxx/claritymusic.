

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistQueryService
{
    Task<IReadOnlyList<ArtistPublicDto>> GetArtistsAsync(string? q, string? search, int take, int skip, CancellationToken cancellationToken = default);
    Task<ArtistDetailsDto?> GetArtistAsync(int id, string? currentUserId, CancellationToken cancellationToken = default);
    Task<PagedResultDto<TrackDto>?> GetArtistTracksAsync(int artistId, int take, int skip, CancellationToken cancellationToken = default);
}
