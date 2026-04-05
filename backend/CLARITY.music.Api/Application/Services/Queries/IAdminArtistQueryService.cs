

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAdminArtistQueryService
{
    Task<PagedResultDto<ArtistAdminDto>> GetAllAsync(int take, int skip, CancellationToken cancellationToken = default);
    Task<ArtistAdminDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<string?> GetNameAsync(int id, CancellationToken cancellationToken = default);
}
