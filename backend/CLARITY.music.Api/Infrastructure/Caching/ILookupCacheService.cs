

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Caching;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ILookupCacheService
{
    Task<PublicLookupsResponseDto> GetPublicAsync(Func<CancellationToken, Task<PublicLookupsResponseDto>> factory, CancellationToken cancellationToken = default);
    Task<AdminLookupsResponseDto> GetAdminAsync(Func<CancellationToken, Task<AdminLookupsResponseDto>> factory, CancellationToken cancellationToken = default);
    void InvalidatePublic();
    void InvalidateAdmin();
    void InvalidateAll();
}
