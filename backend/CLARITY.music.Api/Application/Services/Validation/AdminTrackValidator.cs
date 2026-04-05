

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Validation;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public class AdminTrackValidator : IAdminTrackValidator
{
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public string? Validate(AdminTrackSaveRequest req)
    {
        if (req.ArtistId <= 0) return "Artist selection is required";
        return TrackInputValidation.Validate(req.Title, req.GenreId, req.MoodId, req.DurationSec, req.AudioUrl, req.CoverUrl, requireMood: false);
    }
}
