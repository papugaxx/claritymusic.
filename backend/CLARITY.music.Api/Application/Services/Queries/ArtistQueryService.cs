

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistQueryService : IArtistQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IReadOnlyList<ArtistPublicDto>> GetArtistsAsync(string? q, string? search, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 100);
        var searchTerm = string.IsNullOrWhiteSpace(q) ? search : q;
        var query = _db.Artists.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var pattern = $"%{searchTerm.Trim()}%";
            query = query.Where(artist => EF.Functions.Like(artist.Name, pattern));
        }

        return await query
            .OrderBy(artist => artist.Name)
            .Skip(paging.Skip)
            .Take(paging.Take)
            .Select(ArtistProjections.ToPublicDto())
            .ToListAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<ArtistDetailsDto?> GetArtistAsync(int id, string? currentUserId, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return _db.Artists
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(ArtistProjections.ToDetailsDto(currentUserId))
            .FirstOrDefaultAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<TrackDto>?> GetArtistTracksAsync(int artistId, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        if (!await _db.Artists.AnyAsync(item => item.Id == artistId, queryCancellationToken))
        {
            return null;
        }

        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        var query = _db.Tracks
            .AsNoTracking()
            .Where(track => track.ArtistId == artistId && track.IsActive)
            .OrderByDescending(track => track.PlaysCount)
            .ThenByDescending(track => track.CreatedAt)
            .Select(TrackProjections.ToDto());

        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }
}
