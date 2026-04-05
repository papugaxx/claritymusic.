

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistFollowService : IArtistFollowService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly IArtistOwnershipService _artistOwnership;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistFollowService(ApplicationDbContext db, IArtistOwnershipService artistOwnership)
    {
        
        _db = db;
        _artistOwnership = artistOwnership;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> FollowAsync(int artistId, string userId, CancellationToken cancellationToken = default)
    {
        if (!await ArtistExistsAsync(artistId, cancellationToken))
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Artist not found"));
        }

        if (await _artistOwnership.IsOwnerAsync(userId, artistId, cancellationToken))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("You cannot follow yourself"));
        }

        var already = await _db.ArtistFollows.AnyAsync(item => item.UserId == userId && item.ArtistId == artistId, cancellationToken);
        if (!already)
        {
            _db.ArtistFollows.Add(new Domain.ArtistFollow
            {
                UserId = userId,
                ArtistId = artistId,
            });

            await _db.SaveChangesAsync(cancellationToken);
        }

        return ServiceResult.Ok(new ArtistFollowStateDto
        {
            Followed = true,
            FollowersCount = await CountFollowersAsync(artistId, cancellationToken),
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> UnfollowAsync(int artistId, string userId, CancellationToken cancellationToken = default)
    {
        if (!await ArtistExistsAsync(artistId, cancellationToken))
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Artist not found"));
        }

        var row = await _db.ArtistFollows.FirstOrDefaultAsync(item => item.UserId == userId && item.ArtistId == artistId, cancellationToken);
        if (row is not null)
        {
            _db.ArtistFollows.Remove(row);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return ServiceResult.Ok(new ArtistFollowStateDto
        {
            Followed = false,
            FollowersCount = await CountFollowersAsync(artistId, cancellationToken),
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private Task<bool> ArtistExistsAsync(int artistId, CancellationToken cancellationToken)
    {
        return _db.Artists.AsNoTracking().AnyAsync(item => item.Id == artistId, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private Task<int> CountFollowersAsync(int artistId, CancellationToken cancellationToken)
    {
        return _db.ArtistFollows.CountAsync(item => item.ArtistId == artistId, cancellationToken);
    }
}
