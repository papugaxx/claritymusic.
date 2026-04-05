

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Validation;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackReferenceValidationService : ITrackReferenceValidationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackReferenceValidationService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public Task<string?> ValidateArtistWriteAsync(int genreId, int? moodId, CancellationToken cancellationToken = default)
    {
        return ValidateCoreAsync(artistId: null, genreId, moodId, cancellationToken);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public Task<string?> ValidateAdminWriteAsync(int artistId, int genreId, int? moodId, CancellationToken cancellationToken = default)
    {
        return ValidateCoreAsync(artistId, genreId, moodId, cancellationToken);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private async Task<string?> ValidateCoreAsync(int? artistId, int genreId, int? moodId, CancellationToken cancellationToken)
    {
        if (artistId.HasValue)
        {
            var artistExists = await _db.Artists.AnyAsync(item => item.Id == artistId.Value, cancellationToken);
            if (!artistExists)
            {
                return "Artist not found";
            }
        }

        var genreExists = await _db.Genres.AnyAsync(item => item.Id == genreId, cancellationToken);
        if (!genreExists)
        {
            return "Genre not found";
        }

        if (moodId.HasValue)
        {
            var moodExists = await _db.Moods.AnyAsync(item => item.Id == moodId.Value, cancellationToken);
            if (!moodExists)
            {
                return "Mood not found";
            }
        }

        return null;
    }
}
