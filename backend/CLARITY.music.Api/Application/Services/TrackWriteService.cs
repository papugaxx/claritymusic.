

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;

namespace CLARITY.music.Api.Application.Services;




public static class TrackWriteService
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static void ApplyCommonFields(
        Track track,
        string title,
        int genreId,
        int? moodId,
        int durationSec,
        string? audioUrl,
        string? coverUrl,
        bool isActive)
    {
        track.Title = title.Trim();
        track.GenreId = genreId;
        track.MoodId = moodId;
        track.DurationSec = durationSec;
        track.AudioUrl = MediaUrlPolicy.NormalizePublicUrl(audioUrl)!;
        track.CoverUrl = MediaUrlPolicy.NormalizePublicUrl(coverUrl);
        track.IsActive = isActive;
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public static async Task DeleteReplacedFilesAsync(
        IWebHostEnvironment env,
        ApplicationDbContext db,
        string? oldAudioUrl,
        string? newAudioUrl,
        string? oldCoverUrl,
        string? newCoverUrl)
    {
        if (!string.Equals(oldAudioUrl, newAudioUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(env, db, oldAudioUrl);
        }

        if (!string.Equals(oldCoverUrl, newCoverUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(env, db, oldCoverUrl);
        }
    }
}
