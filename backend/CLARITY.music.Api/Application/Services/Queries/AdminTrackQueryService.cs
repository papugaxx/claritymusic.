

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AdminTrackQueryService : IAdminTrackQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminTrackQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<TrackDto>> GetAllAsync(bool activeOnly, string? q, string? sort, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        IQueryable<Track> query = _db.Tracks;

        if (activeOnly)
        {
            query = query.Where(track => track.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var trimmed = q.Trim();
            if (trimmed.StartsWith("id:", StringComparison.OrdinalIgnoreCase) && int.TryParse(trimmed[3..], out var exactId))
            {
                query = query.Where(track => track.Id == exactId);
            }
            else if (int.TryParse(trimmed, out var numericId))
            {
                var numericLike = $"%{trimmed}%";
                query = query.Where(track =>
                    track.Id == numericId
                    || EF.Functions.Like(track.Title, numericLike)
                    || EF.Functions.Like(track.Artist.Name, numericLike)
                    || EF.Functions.Like(track.Genre.Name, numericLike)
                    || (track.Mood != null && EF.Functions.Like(track.Mood.Name, numericLike)));
            }
            else
            {
                var pattern = $"%{trimmed}%";
                query = query.Where(track =>
                    EF.Functions.Like(track.Title, pattern)
                    || EF.Functions.Like(track.Artist.Name, pattern)
                    || EF.Functions.Like(track.Genre.Name, pattern)
                    || (track.Mood != null && EF.Functions.Like(track.Mood.Name, pattern)));
            }
        }

        query = string.Equals(sort, "title", StringComparison.OrdinalIgnoreCase)
            ? query.OrderBy(track => track.Title)
            : query.OrderByDescending(track => track.PlaysCount);

        var projectedQuery = query
            .AsNoTracking()
            .Select(TrackProjections.ToDto());

        var totalCount = await projectedQuery.CountAsync(queryCancellationToken);
        var items = await projectedQuery.Skip(paging.Skip).Take(paging.Take).ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<TrackDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return _db.Tracks
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(TrackProjections.ToDto())
            .FirstOrDefaultAsync(queryCancellationToken);
    }
}
