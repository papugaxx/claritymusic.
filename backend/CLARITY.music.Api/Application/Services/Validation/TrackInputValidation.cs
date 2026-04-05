

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure;

namespace CLARITY.music.Api.Application.Services.Validation;




public static class TrackInputValidation
{
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public static string? Validate(
        string? title,
        int genreId,
        int? moodId,
        int durationSec,
        string? audioUrl,
        string? coverUrl,
        bool requireMood = true)
    {
        var normalizedTitle = (title ?? string.Empty).Trim();
        if (normalizedTitle.Length < 1 || normalizedTitle.Length > 120)
            return "Track title must contain between 1 and 120 characters";

        if (genreId <= 0)
            return "Genre selection is required";

        if (requireMood && (!moodId.HasValue || moodId.Value <= 0))
            return "Mood selection is required";

        if (moodId.HasValue && moodId.Value <= 0)
            return "Invalid mood";

        if (durationSec < 1 || durationSec > 3600)
            return "Track duration must be between 1 and 3600 seconds";

        var normalizedAudioUrl = MediaUrlPolicy.NormalizePublicUrl(audioUrl);
        if (string.IsNullOrWhiteSpace(normalizedAudioUrl) || normalizedAudioUrl.Length > 500)
            return "Upload an audio file first";

        if (!MediaUrlPolicy.IsSafePersistedAudioUrl(normalizedAudioUrl))
            return "Invalid audio file URL";

        var normalizedCoverUrl = MediaUrlPolicy.NormalizePublicUrl(coverUrl);
        if (normalizedCoverUrl?.Length > 500)
            return "Cover URL is too long";

        if (!MediaUrlPolicy.IsSafePersistedImageUrl(normalizedCoverUrl))
            return "Invalid cover URL";

        return null;
    }
}
