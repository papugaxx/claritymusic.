

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Commands;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistMutationService : IArtistMutationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IArtistOwnershipService _artistOwnership;
    private readonly IArtistProfileValidationService _artistProfileValidation;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistMutationService(
        ApplicationDbContext db,
        IWebHostEnvironment env,
        IArtistOwnershipService artistOwnership,
        IArtistProfileValidationService artistProfileValidation)
    {
        
        _db = db;
        _env = env;
        _artistOwnership = artistOwnership;
        _artistProfileValidation = artistProfileValidation;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ArtistWriteResult> CreateAsync(ArtistMutationInput input, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var validation = await ValidateAsync(input, currentArtistId: null, writeCancellationToken);
        if (!validation.Succeeded)
        {
            return new ArtistWriteResult(null, BuildValidationError(validation.Error!));
        }

        var artist = new Artist
        {
            Name = validation.Name,
            Slug = validation.Slug,
            AvatarUrl = validation.AvatarUrl,
            CoverUrl = validation.CoverUrl,
        };

        _db.Artists.Add(artist);
        await _db.SaveChangesAsync(writeCancellationToken);
        await _artistOwnership.SetOwnerAsync(artist.Id, validation.OwnerUserId, writeCancellationToken);

        return new ArtistWriteResult(artist, null);
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ArtistWriteResult> UpdateAsync(int artistId, ArtistMutationInput input, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var artist = await _db.Artists.FirstOrDefaultAsync(item => item.Id == artistId, writeCancellationToken);
        if (artist is null)
        {
            return new ArtistWriteResult(null, ServiceResult.NotFound(ApiErrorResponse.Create("Artist not found")));
        }

        var validation = await ValidateAsync(input, artistId, writeCancellationToken);
        if (!validation.Succeeded)
        {
            return new ArtistWriteResult(null, BuildValidationError(validation.Error!));
        }

        var oldAvatarUrl = artist.AvatarUrl;
        var oldCoverUrl = artist.CoverUrl;

        artist.Name = validation.Name;
        artist.Slug = validation.Slug;
        artist.AvatarUrl = validation.AvatarUrl;
        artist.CoverUrl = validation.CoverUrl;

        await _db.SaveChangesAsync(writeCancellationToken);
        await _artistOwnership.SetOwnerAsync(artist.Id, validation.OwnerUserId, writeCancellationToken);

        await DeleteReplacedImagesAsync(oldAvatarUrl, artist.AvatarUrl, oldCoverUrl, artist.CoverUrl, writeCancellationToken);

        return new ArtistWriteResult(artist, null);
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteAsync(int artistId, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var artist = await _db.Artists
            .AsNoTracking()
            .Where(item => item.Id == artistId)
            .Select(item => new
            {
                Entity = item,
                OwnerUserId = item.OwnerLink == null ? null : item.OwnerLink.UserId,
            })
            .FirstOrDefaultAsync(writeCancellationToken);

        if (artist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Artist not found"));
        }

        var hasTracks = await _db.Tracks.AnyAsync(track => track.ArtistId == artistId, writeCancellationToken);
        if (hasTracks)
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create("Cannot delete an artist while tracks are still assigned"));
        }

        var oldAvatarUrl = artist.Entity.AvatarUrl;
        var oldCoverUrl = artist.Entity.CoverUrl;

        await _db.ArtistFollows.Where(item => item.ArtistId == artistId).ExecuteDeleteAsync(writeCancellationToken);
        await _db.ArtistOwners.Where(item => item.ArtistId == artistId).ExecuteDeleteAsync(writeCancellationToken);
        _db.Artists.Remove(artist.Entity);
        await _db.SaveChangesAsync(writeCancellationToken);

        if (!string.IsNullOrWhiteSpace(artist.OwnerUserId))
        {
            await _artistOwnership.SyncArtistRoleAsync(artist.OwnerUserId, writeCancellationToken);
        }

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldAvatarUrl, writeCancellationToken);
        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl, writeCancellationToken);

        return ServiceResult.Ok(new DeletionResponseDto
        {
            Deleted = true,
            Id = artistId,
        });
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private Task<ArtistProfileValidationResult> ValidateAsync(ArtistMutationInput input, int? currentArtistId, CancellationToken cancellationToken)
    {
        return _artistProfileValidation.ValidateAsync(
            input.Name,
            input.Slug,
            input.AvatarUrl,
            input.CoverUrl,
            currentArtistId,
            input.OwnerUserId,
            input.ValidateOwnerUser,
            cancellationToken);
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    private async Task DeleteReplacedImagesAsync(
        string? oldAvatarUrl,
        string? newAvatarUrl,
        string? oldCoverUrl,
        string? newCoverUrl,
        CancellationToken cancellationToken)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        if (!string.Equals(oldAvatarUrl, newAvatarUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldAvatarUrl, writeCancellationToken);
        }

        if (!string.Equals(oldCoverUrl, newCoverUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl, writeCancellationToken);
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static ServiceResult BuildValidationError(string error)
    {
        if (error is "An artist with this name already exists" or "Artist slug is already in use")
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create(error));
        }

        if (error == "This user is already linked to another artist")
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create(error));
        }

        return ServiceResult.BadRequest(ApiErrorResponse.Create(error));
    }
}
