

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LikeQueryService : ILikeQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LikeQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IReadOnlyList<int>> GetIdsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return await _db.LikedTracks
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.Track.IsActive)
            .Select(item => item.TrackId)
            .ToListAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<LikedTrackListItemDto>> GetLikedAsync(string userId, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 50, maxTake: 500);
        var query = _db.LikedTracks
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.Track.IsActive)
            .OrderByDescending(item => item.CreatedAt)
            .Select(LikeProjections.ToListItemDto());

        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }
}
