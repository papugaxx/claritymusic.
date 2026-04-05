

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Queries;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ILookupQueryService
{
    Task<IReadOnlyList<LookupItemDto>> GetGenresAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LookupItemDto>> GetMoodsAsync(CancellationToken cancellationToken = default);
    Task<PublicLookupsResponseDto> GetPublicAsync(CancellationToken cancellationToken = default);
    Task<AdminLookupsResponseDto> GetAdminAsync(CancellationToken cancellationToken = default);
}
