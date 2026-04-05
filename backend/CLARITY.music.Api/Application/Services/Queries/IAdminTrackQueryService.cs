

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAdminTrackQueryService
{
    Task<PagedResultDto<TrackDto>> GetAllAsync(bool activeOnly, string? q, string? sort, int take, int skip, CancellationToken cancellationToken = default);
    Task<TrackDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
