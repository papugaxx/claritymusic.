

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class PlaylistQueryService : IPlaylistQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public PlaylistQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<PlaylistSummaryDto>> GetMineAsync(string userId, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        var query = _db.Playlists
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Select(PlaylistProjections.ToSummaryDtoExpression());

        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PlaylistDetailsDto?> GetOwnedDetailsAsync(string userId, int playlistId, int take, int skip, string? sort, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 50, maxTake: 500);
        var playlist = await _db.Playlists
            .AsNoTracking()
            .Where(item => item.Id == playlistId && item.UserId == userId)
            .Select(PlaylistProjections.ToSummaryDtoExpression())
            .FirstOrDefaultAsync(queryCancellationToken);

        if (playlist is null)
        {
            return null;
        }

        var normalizedSort = PlaylistProjections.NormalizeTrackSort(sort);
        var tracksBaseQuery = _db.PlaylistTracks
            .AsNoTracking()
            .Where(item => item.PlaylistId == playlistId && item.Track.IsActive);

        var totalCount = await tracksBaseQuery.CountAsync(queryCancellationToken);
        var items = await PlaylistProjections.ApplyTrackSort(tracksBaseQuery, normalizedSort)
            .Select(PlaylistProjections.ToTrackListItemDto())
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return new PlaylistDetailsDto
        {
            Id = playlist.Id,
            Name = playlist.Name,
            CreatedAt = playlist.CreatedAt,
            CoverUrl = playlist.CoverUrl,
            Tracks = PagedResult.Create(items, totalCount, paging.Skip, paging.Take),
        };
    }
}
