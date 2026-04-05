

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class MeQueryService : IMeQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public MeQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IReadOnlyList<TrackDto>> GetRecentAsync(string userId, int take, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        take = PagingBounds.NormalizeTake(take, defaultTake: 12, maxTake: 50);

        var ids = await _db.TrackPlays
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .GroupBy(item => item.TrackId)
            .Select(group => new { TrackId = group.Key, LastPlayedAt = group.Max(item => item.PlayedAt) })
            .Join(
                _db.Tracks.Where(track => track.IsActive),
                play => play.TrackId,
                track => track.Id,
                (play, track) => new { play.TrackId, play.LastPlayedAt })
            .OrderByDescending(item => item.LastPlayedAt)
            .Take(take)
            .Select(item => item.TrackId)
            .ToListAsync(queryCancellationToken);

        if (ids.Count == 0)
        {
            return Array.Empty<TrackDto>();
        }

        var order = ids.Select((id, index) => new { id, index }).ToDictionary(item => item.id, item => item.index);
        var tracks = await _db.Tracks
            .AsNoTracking()
            .Where(track => ids.Contains(track.Id) && track.IsActive)
            .Select(TrackProjections.ToDto())
            .ToListAsync(queryCancellationToken);

        return tracks.OrderBy(track => order[track.Id]).ToList();
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<FollowingArtistDto>> GetFollowingAsync(string userId, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        var query = _db.ArtistFollows
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new FollowingArtistDto
            {
                ArtistId = item.ArtistId,
                ArtistName = item.Artist.Name,
                AvatarUrl = item.Artist.AvatarUrl,
                CoverUrl = item.Artist.CoverUrl,
                CreatedAt = item.CreatedAt,
            });

        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }
}
