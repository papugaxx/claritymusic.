

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackMutationResultFactory : ITrackMutationResultFactory
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackMutationResultFactory(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<TrackMutationResultDto> BuildAsync(int trackId, bool updated = false, CancellationToken cancellationToken = default)
    {
        var track = await _db.Tracks
            .AsNoTracking()
            .Where(item => item.Id == trackId)
            .Select(TrackProjections.ToDto())
            .FirstOrDefaultAsync(cancellationToken);

        if (track is null)
        {
            return new TrackMutationResultDto
            {
                Id = trackId,
                Updated = updated,
            };
        }

        return new TrackMutationResultDto
        {
            Id = track.Id,
            IsActive = track.IsActive,
            Updated = updated,
            Track = track,
        };
    }
}
