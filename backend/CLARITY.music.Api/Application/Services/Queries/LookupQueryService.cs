

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LookupQueryService : ILookupQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LookupQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IReadOnlyList<LookupItemDto>> GetGenresAsync(CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return await _db.Genres
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .Select(LookupProjections.ToGenreDto())
            .ToListAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IReadOnlyList<LookupItemDto>> GetMoodsAsync(CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return await _db.Moods
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .Select(LookupProjections.ToMoodDto())
            .ToListAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PublicLookupsResponseDto> GetPublicAsync(CancellationToken cancellationToken = default)
    {
        var genres = await GetGenresAsync(cancellationToken);
        var moods = await GetMoodsAsync(cancellationToken);

        return new PublicLookupsResponseDto
        {
            Genres = genres.ToList(),
            Moods = moods.ToList(),
        };
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<AdminLookupsResponseDto> GetAdminAsync(CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var artists = await _db.Artists
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .Select(LookupProjections.ToArtistDto())
            .ToListAsync(queryCancellationToken);

        var publicLookups = await GetPublicAsync(cancellationToken);
        return new AdminLookupsResponseDto
        {
            Artists = artists,
            Genres = publicLookups.Genres,
            Moods = publicLookups.Moods,
        };
    }
}
