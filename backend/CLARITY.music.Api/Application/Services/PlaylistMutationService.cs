

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Http;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class PlaylistMutationService : IPlaylistMutationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private const string CoversFolder = "uploads/playlist-covers";

    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PlaylistMutationService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public PlaylistMutationService(
        ApplicationDbContext db,
        IWebHostEnvironment env,
        ILogger<PlaylistMutationService> logger)
    {
        
        _db = db;
        _env = env;
        _logger = logger;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<Playlist?> GetOwnedAsync(int playlistId, string userId, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var query = _db.Playlists.Where(item => item.Id == playlistId && item.UserId == userId);
        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(cancellationToken);
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> CreateAsync(string userId, string? userEmail, CreatePlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var nameError = TryNormalizeName(request.Name, out var normalizedName);
        if (nameError is not null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(nameError));
        }

        var playlist = new Playlist
        {
            Name = normalizedName!,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Playlists.Add(playlist);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPlaylistNameConstraintViolation(ex))
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create("A playlist with this name already exists"));
        }

        _logger.LogInformation(
            "PLAYLIST CREATE: userId={UserId} email={Email} playlistId={PlaylistId}",
            userId,
            userEmail ?? "unknown",
            playlist.Id);

        return ServiceResult.Ok(PlaylistProjections.ToSummaryDto(playlist));
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateAsync(int playlistId, string userId, UpdatePlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var oldCoverUrl = playlist.CoverUrl;

        if (request.Name is not null)
        {
            var nameError = TryNormalizeName(request.Name, out var normalizedName);
            if (nameError is not null)
            {
                return ServiceResult.BadRequest(ApiErrorResponse.Create(nameError));
            }

            playlist.Name = normalizedName!;
        }

        if (request.CoverUrl is not null)
        {
            var coverError = TryNormalizeCoverUrl(request.CoverUrl, out var normalizedCoverUrl);
            if (coverError is not null)
            {
                return ServiceResult.BadRequest(ApiErrorResponse.Create(coverError));
            }

            playlist.CoverUrl = normalizedCoverUrl;
        }

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPlaylistNameConstraintViolation(ex))
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create("A playlist with this name already exists"));
        }

        if (!string.Equals(oldCoverUrl, playlist.CoverUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl);
        }

        return ServiceResult.Ok(PlaylistProjections.ToSummaryDto(playlist));
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteAsync(int playlistId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var oldCoverUrl = playlist.CoverUrl;

        await _db.PlaylistTracks
            .Where(item => item.PlaylistId == playlistId)
            .ExecuteDeleteAsync(cancellationToken);

        _db.Playlists.Remove(playlist);
        await _db.SaveChangesAsync(cancellationToken);

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl);

        _logger.LogInformation(
            "PLAYLIST DELETE: userId={UserId} email={Email} playlistId={PlaylistId}",
            userId,
            userEmail ?? "unknown",
            playlistId);

        return ServiceResult.Ok(new DeletionResponseDto
        {
            Deleted = true,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> HasTrackAsync(int playlistId, int trackId, string userId, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, asNoTracking: true, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var exists = await _db.PlaylistTracks.AnyAsync(
            item => item.PlaylistId == playlistId && item.TrackId == trackId && item.Track.IsActive,
            cancellationToken);

        return ServiceResult.Ok(new ExistenceResponseDto
        {
            Exists = exists,
        });
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> AddTrackAsync(int playlistId, int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var trackExists = await _db.Tracks.AnyAsync(item => item.Id == trackId && item.IsActive, cancellationToken);
        if (!trackExists)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Track not found or unavailable"));
        }

        var exists = await _db.PlaylistTracks.AnyAsync(
            item => item.PlaylistId == playlistId && item.TrackId == trackId && item.Track.IsActive,
            cancellationToken);

        if (exists)
        {
            return ServiceResult.Ok(new PlaylistTrackMutationResponseDto
            {
                Added = false,
                Reason = "already-exists",
            });
        }

        _db.PlaylistTracks.Add(new PlaylistTrack
        {
            PlaylistId = playlistId,
            TrackId = trackId,
        });

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPlaylistTrackConstraintViolation(ex))
        {
            return ServiceResult.Ok(new PlaylistTrackMutationResponseDto
            {
                Added = false,
                Reason = "already-exists",
            });
        }

        _logger.LogInformation(
            "PLAYLIST ADD TRACK: userId={UserId} email={Email} playlistId={PlaylistId} trackId={TrackId}",
            userId,
            userEmail ?? "unknown",
            playlistId,
            trackId);

        return ServiceResult.Ok(new PlaylistTrackMutationResponseDto
        {
            Added = true,
        });
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> RemoveTrackAsync(int playlistId, int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, asNoTracking: true, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var rows = await _db.PlaylistTracks
            .Where(item => item.PlaylistId == playlistId && item.TrackId == trackId)
            .ExecuteDeleteAsync(cancellationToken);

        _logger.LogInformation(
            "PLAYLIST REMOVE TRACK: userId={UserId} email={Email} playlistId={PlaylistId} trackId={TrackId}",
            userId,
            userEmail ?? "unknown",
            playlistId,
            trackId);

        return ServiceResult.Ok(new RemovalResponseDto
        {
            Removed = rows > 0,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> UploadCoverAsync(int playlistId, string userId, IFormFile? file, string? userEmail, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        if (file == null || file.Length == 0)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("File is empty"));
        }

        const int maxBytes = 10 * 1024 * 1024;
        if (!UploadValidation.TryValidateImage(file, maxBytes, out var uploadError, out var extension))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(uploadError));
        }

        var folderPath = Path.Combine(_env.WebRootPath, CoversFolder.Replace("/", Path.DirectorySeparatorChar.ToString()));
        Directory.CreateDirectory(folderPath);

        var oldCoverUrl = playlist.CoverUrl;
        var fileName = await UploadValidation.SaveAsync(file, folderPath, extension);
        var publicUrl = "/" + CoversFolder.Trim('/') + "/" + fileName;
        publicUrl = publicUrl.Replace("\\", "/");

        playlist.CoverUrl = publicUrl;
        await _db.SaveChangesAsync(cancellationToken);

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl);

        _logger.LogInformation(
            "PLAYLIST COVER UPLOAD: userId={UserId} email={Email} playlistId={PlaylistId} coverUrl={CoverUrl}",
            userId,
            userEmail ?? "unknown",
            playlistId,
            publicUrl);

        return ServiceResult.Ok(new UploadResultDto
        {
            Url = playlist.CoverUrl ?? string.Empty,
            Kind = "cover",
            CoverUrl = playlist.CoverUrl,
        });
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> RemoveCoverAsync(int playlistId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        var playlist = await GetOwnedAsync(playlistId, userId, cancellationToken: cancellationToken);
        if (playlist is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Playlist not found"));
        }

        var oldCoverUrl = playlist.CoverUrl;
        playlist.CoverUrl = null;
        await _db.SaveChangesAsync(cancellationToken);

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl);

        _logger.LogInformation(
            "PLAYLIST COVER REMOVE: userId={UserId} email={Email} playlistId={PlaylistId}",
            userId,
            userEmail ?? "unknown",
            playlistId);

        return ServiceResult.Ok(new RemovalResponseDto
        {
            Removed = true,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string? TryNormalizeName(string? value, out string? normalizedName)
    {
        normalizedName = (value ?? string.Empty).Trim();
        return normalizedName.Length is < 1 or > 80
            ? "Playlist name must contain between 1 and 80 characters"
            : null;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string? TryNormalizeCoverUrl(string? value, out string? normalizedCoverUrl)
    {
        normalizedCoverUrl = MediaUrlPolicy.NormalizePublicUrl(value);
        if (normalizedCoverUrl is null)
        {
            return null;
        }

        if (normalizedCoverUrl.Length > 500)
        {
            return "Cover URL is too long";
        }

        return MediaUrlPolicy.IsSafePersistedImageUrl(normalizedCoverUrl)
            ? null
            : "Invalid cover URL";
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    private static bool IsPlaylistNameConstraintViolation(DbUpdateException exception)
    {
        return DbText.ContainsUniqueConstraint(exception, "IX_Playlists_UserId_Name");
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    private static bool IsPlaylistTrackConstraintViolation(DbUpdateException exception)
    {
        return DbText.ContainsUniqueConstraint(exception, "PK_PlaylistTracks");
    }
}
