

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Queries;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistStudioQueryService : IArtistStudioQueryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistStudioQueryService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<ArtistPublicDto?> GetOwnedArtistAsync(string userId, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        return _db.Artists
            .AsNoTracking()
            .Where(item => item.OwnerLink != null && item.OwnerLink.UserId == userId)
            .Select(ArtistProjections.ToPublicDto())
            .FirstOrDefaultAsync(queryCancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<PagedResultDto<TrackDto>> GetTracksAsync(int artistId, int take, int skip, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var paging = PagingBounds.Normalize(take, skip, defaultTake: 20, maxTake: 200);
        var query = _db.Tracks
            .AsNoTracking()
            .Where(item => item.ArtistId == artistId)
            .OrderByDescending(item => item.Id)
            .Select(TrackProjections.ToDto());

        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query
            .Skip(paging.Skip)
            .Take(paging.Take)
            .ToListAsync(queryCancellationToken);

        return PagedResult.Create(items, totalCount, paging.Skip, paging.Take);
    }
}
