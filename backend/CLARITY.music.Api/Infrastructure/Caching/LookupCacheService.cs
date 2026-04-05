

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Options;
using CLARITY.music.Api.DTOs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Infrastructure.Caching;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LookupCacheService : ILookupCacheService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private const string PublicLookupsCacheKey = "lookups:public:v1";
    private const string AdminLookupsCacheKey = "lookups:admin:v1";

    private readonly IMemoryCache _cache;
    private readonly LookupCachingOptions _options;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LookupCacheService(IMemoryCache cache, IOptions<LookupCachingOptions> options)
    {
        
        _cache = cache;
        _options = options.Value;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<PublicLookupsResponseDto> GetPublicAsync(Func<CancellationToken, Task<PublicLookupsResponseDto>> factory, CancellationToken cancellationToken = default)
    {
        
        return _cache.GetOrCreateAsync(PublicLookupsCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(NormalizeSeconds(_options.PublicLookupsTtlSeconds, fallback: 300));
            return await factory(cancellationToken);
        })!;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<AdminLookupsResponseDto> GetAdminAsync(Func<CancellationToken, Task<AdminLookupsResponseDto>> factory, CancellationToken cancellationToken = default)
    {
        
        return _cache.GetOrCreateAsync(AdminLookupsCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(NormalizeSeconds(_options.AdminLookupsTtlSeconds, fallback: 180));
            return await factory(cancellationToken);
        })!;
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void InvalidatePublic()
    {
        _cache.Remove(PublicLookupsCacheKey);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void InvalidateAdmin()
    {
        _cache.Remove(AdminLookupsCacheKey);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void InvalidateAll()
    {
        InvalidatePublic();
        InvalidateAdmin();
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static int NormalizeSeconds(int configuredValue, int fallback)
    {
        return configuredValue > 0 ? configuredValue : fallback;
    }
}
