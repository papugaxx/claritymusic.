

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LikeMutationService : ILikeMutationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly ILogger<LikeMutationService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LikeMutationService(ApplicationDbContext db, ILogger<LikeMutationService> logger)
    {
        
        _db = db;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ToggleAsync(int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        if (!await TrackExistsAsync(trackId, cancellationToken))
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        var like = await _db.LikedTracks.FirstOrDefaultAsync(item => item.UserId == userId && item.TrackId == trackId, cancellationToken);
        if (like is not null)
        {
            _db.LikedTracks.Remove(like);
            await _db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("LIKE REMOVE: userId={UserId} email={Email} trackId={TrackId}", userId, userEmail ?? "unknown", trackId);
            return ServiceResult.Ok(new LikeStateResponseDto
            {
                Liked = false,
                Changed = true,
            });
        }

        _db.LikedTracks.Add(new LikedTrack
        {
            UserId = userId,
            TrackId = trackId,
        });

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "LIKE ADD FAILED: userId={UserId} trackId={TrackId}", userId, trackId);
            return ServiceResult.Conflict(ApiErrorResponse.Create("Could not add the track to favorites"));
        }

        _logger.LogInformation("LIKE ADD: userId={UserId} email={Email} trackId={TrackId}", userId, userEmail ?? "unknown", trackId);
        return ServiceResult.Ok(new LikeStateResponseDto
        {
            Liked = true,
            Changed = true,
        });
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> AddAsync(int trackId, string userId, CancellationToken cancellationToken = default)
    {
        if (!await TrackExistsAsync(trackId, cancellationToken))
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        var exists = await _db.LikedTracks.AnyAsync(item => item.UserId == userId && item.TrackId == trackId, cancellationToken);
        if (exists)
        {
            return ServiceResult.Ok(new LikeStateResponseDto
            {
                Liked = true,
                Changed = false,
            });
        }

        _db.LikedTracks.Add(new LikedTrack
        {
            UserId = userId,
            TrackId = trackId,
        });

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "LIKE ADD FAILED: userId={UserId} trackId={TrackId}", userId, trackId);
            return ServiceResult.Conflict(ApiErrorResponse.Create("Could not add the track to favorites"));
        }

        return ServiceResult.Ok(new LikeStateResponseDto
        {
            Liked = true,
            Changed = true,
        });
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> RemoveAsync(int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default)
    {
        var like = await _db.LikedTracks.FirstOrDefaultAsync(item => item.UserId == userId && item.TrackId == trackId, cancellationToken);
        if (like is null)
        {
            return ServiceResult.Ok(new LikeStateResponseDto
            {
                Liked = false,
                Changed = false,
            });
        }

        _db.LikedTracks.Remove(like);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("LIKE REMOVE (DELETE): userId={UserId} email={Email} trackId={TrackId}", userId, userEmail ?? "unknown", trackId);

        return ServiceResult.Ok(new LikeStateResponseDto
        {
            Liked = false,
            Changed = true,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private Task<bool> TrackExistsAsync(int trackId, CancellationToken cancellationToken)
    {
        return _db.Tracks.AnyAsync(item => item.Id == trackId && item.IsActive, cancellationToken);
    }
}
