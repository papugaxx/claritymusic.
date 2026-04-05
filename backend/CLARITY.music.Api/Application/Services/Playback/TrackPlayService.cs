

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Data;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Commands;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Playback;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackPlayService : ITrackPlayService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly TimeSpan PlayDedupeWindow = TimeSpan.FromSeconds(30);

    private readonly ApplicationDbContext _db;
    private readonly ILogger<TrackPlayService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackPlayService(ApplicationDbContext db, ILogger<TrackPlayService> logger)
    {
        
        _db = db;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> RecordPlayAsync(int trackId, string userId, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var playedAt = DateTime.UtcNow;
        var dedupeThreshold = playedAt.Subtract(PlayDedupeWindow);

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, writeCancellationToken);

        var track = await _db.Tracks.FirstOrDefaultAsync(item => item.Id == trackId, writeCancellationToken);
        if (track is null || !track.IsActive)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Track not found"));
        }

        var recentlyPlayed = await _db.TrackPlays.AnyAsync(
            play => play.UserId == userId && play.TrackId == trackId && play.PlayedAt >= dedupeThreshold,
            writeCancellationToken);

        if (recentlyPlayed)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return ServiceResult.Ok(new TrackPlayResponseDto
            {
                TrackId = track.Id,
                PlaysCount = track.PlaysCount,
                Deduped = true,
            });
        }

        track.PlaysCount++;
        _db.TrackPlays.Add(new TrackPlay
        {
            UserId = userId,
            TrackId = track.Id,
            PlayedAt = playedAt,
        });

        await _db.SaveChangesAsync(writeCancellationToken);
        await transaction.CommitAsync(writeCancellationToken);

        _logger.LogInformation(
            "PLAY: userId={UserId} email={Email} trackId={TrackId} playsCount={PlaysCount}",
            userId,
            actorEmail ?? "unknown",
            track.Id,
            track.PlaysCount);

        return ServiceResult.Ok(new TrackPlayResponseDto
        {
            TrackId = track.Id,
            PlaysCount = track.PlaysCount,
        });
    }
}
