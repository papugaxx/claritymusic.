

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackQueryService : ITrackQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<TrackDto>> GetAllAsync(
        string? q,
        string? search,
        int? genreId,
        int? moodId,
        string? sort,
        int take,
        int skip,
        CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        var searchTerm = string.IsNullOrWhiteSpace(q) ? search : q;

        IQueryable<Track> query = _db.Tracks
            .AsNoTracking()
            .Where(track => track.IsActive);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var like = $"%{searchTerm.Trim()}%";
            query = query.Where(track =>
                EF.Functions.Like(track.Title, like)
                || EF.Functions.Like(track.Artist.Name, like)
                || EF.Functions.Like(track.Genre.Name, like)
                || (track.Mood != null && EF.Functions.Like(track.Mood.Name, like)));
        }

        if (genreId.HasValue)
        {
            query = query.Where(track => track.GenreId == genreId.Value);
        }

        if (moodId.HasValue)
        {
            query = query.Where(track => track.MoodId == moodId.Value);
        }

        query = string.Equals(sort, "title", StringComparison.OrdinalIgnoreCase)
            ? query.OrderBy(track => track.Title).ThenByDescending(track => track.CreatedAt)
            : string.Equals(sort, "new", StringComparison.OrdinalIgnoreCase)
                ? query.OrderByDescending(track => track.CreatedAt).ThenByDescending(track => track.Id)
                : query.OrderByDescending(track => track.PlaysCount).ThenByDescending(track => track.CreatedAt);

        var projectedQuery = query.Select(TrackProjections.ToDto());
        var totalCount = await projectedQuery.CountAsync(queryCancellationToken);
        var items = await projectedQuery
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<TrackDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return _db.Tracks
            .AsNoTracking()
            .Where(item => item.Id == id && item.IsActive)
            .Select(TrackProjections.ToDto())
            .FirstOrDefaultAsync(queryCancellationToken);
    }
}
