

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services.Validation;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackMutationService : ITrackMutationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IAdminTrackValidator _adminValidator;
    private readonly ITrackReferenceValidationService _trackReferenceValidation;
    private readonly ITrackMutationResultFactory _trackMutationResultFactory;
    private readonly ILogger<TrackMutationService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackMutationService(
        ApplicationDbContext db,
        IWebHostEnvironment env,
        IAdminTrackValidator adminValidator,
        ITrackReferenceValidationService trackReferenceValidation,
        ITrackMutationResultFactory trackMutationResultFactory,
        ILogger<TrackMutationService> logger)
    {
        
        _db = db;
        _env = env;
        _adminValidator = adminValidator;
        _trackReferenceValidation = trackReferenceValidation;
        _trackMutationResultFactory = trackMutationResultFactory;
        _logger = logger;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> CreateAdminAsync(AdminTrackSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var validationError = await ValidateAdminAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(validationError));
        }

        var track = new Track
        {
            ArtistId = request.ArtistId,
        };

        ApplyAdminFields(track, request);

        _db.Tracks.Add(track);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} created track {TrackId} '{Title}'", actorEmail ?? "unknown", track.Id, track.Title);
        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(track.Id, cancellationToken: cancellationToken));
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateAdminAsync(int trackId, AdminTrackSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(item => item.Id == trackId, cancellationToken);
        if (track is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        var validationError = await ValidateAdminAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(validationError));
        }

        var oldAudioUrl = track.AudioUrl;
        var oldCoverUrl = track.CoverUrl;

        track.ArtistId = request.ArtistId;
        ApplyAdminFields(track, request);

        await _db.SaveChangesAsync(cancellationToken);
        await TrackWriteService.DeleteReplacedFilesAsync(_env, _db, oldAudioUrl, track.AudioUrl, oldCoverUrl, track.CoverUrl);

        _logger.LogInformation("ADMIN {Email} updated track {TrackId} '{Title}'", actorEmail ?? "unknown", track.Id, track.Title);
        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(track.Id, updated: true, cancellationToken: cancellationToken));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> SetAdminStatusAsync(int trackId, bool isActive, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(item => item.Id == trackId, cancellationToken);
        if (track is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        track.IsActive = isActive;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} set track {TrackId} status IsActive={IsActive}", actorEmail ?? "unknown", track.Id, track.IsActive);
        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(track.Id, updated: true, cancellationToken: cancellationToken));
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteAdminAsync(int trackId, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(item => item.Id == trackId, cancellationToken);
        if (track is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        var oldAudioUrl = track.AudioUrl;
        var oldCoverUrl = track.CoverUrl;

        await _db.PlaylistTracks.Where(item => item.TrackId == trackId).ExecuteDeleteAsync(cancellationToken);
        _db.Tracks.Remove(track);
        await _db.SaveChangesAsync(cancellationToken);

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldAudioUrl, cancellationToken);
        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl, cancellationToken);

        _logger.LogInformation("ADMIN {Email} deleted track {TrackId} '{Title}'", actorEmail ?? "unknown", track.Id, track.Title);
        return ServiceResult.Ok(new TrackMutationResultDto
        {
            Id = trackId,
            IsActive = false,
            Deleted = true,
        });
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> CreateArtistAsync(int artistId, ArtistTrackSaveRequest request, CancellationToken cancellationToken = default)
    {
        var validationError = await ValidateArtistAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(validationError));
        }

        var track = new Track
        {
            ArtistId = artistId,
        };

        ApplyArtistFields(track, request);

        _db.Tracks.Add(track);
        await _db.SaveChangesAsync(cancellationToken);

        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(track.Id, cancellationToken: cancellationToken));
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateArtistAsync(int trackId, int artistId, ArtistTrackSaveRequest request, CancellationToken cancellationToken = default)
    {
        var trackResult = await GetOwnedTrackAsync(trackId, artistId, cancellationToken);
        if (trackResult.Error is not null)
        {
            return trackResult.Error;
        }

        var validationError = await ValidateArtistAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(validationError));
        }

        var track = trackResult.Entity!;
        var oldAudioUrl = track.AudioUrl;
        var oldCoverUrl = track.CoverUrl;

        ApplyArtistFields(track, request);

        await _db.SaveChangesAsync(cancellationToken);
        await TrackWriteService.DeleteReplacedFilesAsync(_env, _db, oldAudioUrl, track.AudioUrl, oldCoverUrl, track.CoverUrl);

        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(track.Id, updated: true, cancellationToken: cancellationToken));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> SetArtistStatusAsync(int trackId, int artistId, bool isActive, CancellationToken cancellationToken = default)
    {
        var trackResult = await GetOwnedTrackAsync(trackId, artistId, cancellationToken);
        if (trackResult.Error is not null)
        {
            return trackResult.Error;
        }

        trackResult.Entity!.IsActive = isActive;
        await _db.SaveChangesAsync(cancellationToken);

        return ServiceResult.Ok(await _trackMutationResultFactory.BuildAsync(trackResult.Entity.Id, updated: true, cancellationToken: cancellationToken));
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteArtistAsync(int trackId, int artistId, CancellationToken cancellationToken = default)
    {
        var trackResult = await GetOwnedTrackAsync(trackId, artistId, cancellationToken);
        if (trackResult.Error is not null)
        {
            return trackResult.Error;
        }

        var track = trackResult.Entity!;
        var oldAudioUrl = track.AudioUrl;
        var oldCoverUrl = track.CoverUrl;

        await _db.PlaylistTracks.Where(item => item.TrackId == trackId).ExecuteDeleteAsync(cancellationToken);
        _db.Tracks.Remove(track);
        await _db.SaveChangesAsync(cancellationToken);

        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldAudioUrl, cancellationToken);
        await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldCoverUrl, cancellationToken);

        return ServiceResult.Ok(new TrackMutationResultDto
        {
            Id = trackId,
            IsActive = false,
            Deleted = true,
        });
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private async Task<string?> ValidateAdminAsync(AdminTrackSaveRequest request, CancellationToken cancellationToken)
    {
        var validationError = _adminValidator.Validate(request);
        if (validationError is not null)
        {
            return validationError;
        }

        return await _trackReferenceValidation.ValidateAdminWriteAsync(
            request.ArtistId,
            request.GenreId,
            request.MoodId,
            cancellationToken);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private async Task<string?> ValidateArtistAsync(ArtistTrackSaveRequest request, CancellationToken cancellationToken)
    {
        var validationError = TrackInputValidation.Validate(
            request.Title,
            request.GenreId,
            request.MoodId,
            request.DurationSec,
            request.AudioUrl,
            request.CoverUrl,
            requireMood: false);

        if (validationError is not null)
        {
            return validationError;
        }

        return await _trackReferenceValidation.ValidateArtistWriteAsync(
            request.GenreId,
            request.MoodId,
            cancellationToken);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    private async Task<OwnedTrackLookupResult> GetOwnedTrackAsync(int trackId, int artistId, CancellationToken cancellationToken)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(item => item.Id == trackId, cancellationToken);
        if (track is null)
        {
            return new OwnedTrackLookupResult(null, ServiceResult.NotFound(ApiErrorResponse.Create("Track not found")));
        }

        if (track.ArtistId != artistId)
        {
            return new OwnedTrackLookupResult(null, ServiceResult.Forbidden(ApiErrorResponse.Create("Insufficient permissions")));
        }

        return new OwnedTrackLookupResult(track, null);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ApplyAdminFields(Track track, AdminTrackSaveRequest request)
    {
        TrackWriteService.ApplyCommonFields(
            track,
            request.Title!,
            request.GenreId,
            request.MoodId,
            request.DurationSec,
            request.AudioUrl,
            request.CoverUrl,
            request.IsActive);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ApplyArtistFields(Track track, ArtistTrackSaveRequest request)
    {
        TrackWriteService.ApplyCommonFields(
            track,
            request.Title!,
            request.GenreId,
            request.MoodId,
            request.DurationSec,
            request.AudioUrl,
            request.CoverUrl,
            request.IsActive);
    }

    // Record нижче задає компактну форму даних для передачі між шарами
    private sealed record OwnedTrackLookupResult(Track? Entity, ServiceResult? Error);
}
