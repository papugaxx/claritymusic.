

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure;




public static class ManagedUploadFiles
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly string[] AllowedPublicPrefixes =
    [
        "audio/",
        "uploads/avatars/",
        "uploads/covers/",
        "uploads/playlist-covers/"
    ];

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsManagedPublicUrl(string? publicUrl)
    {
        if (string.IsNullOrWhiteSpace(publicUrl)) return false;
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (normalized == null) return false;
        if (normalized.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return false;

        var trimmed = normalized.TrimStart('/');
        if (trimmed.Contains("..", StringComparison.Ordinal)) return false;
        return AllowedPublicPrefixes.Any(prefix => trimmed.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }

    // Метод нижче перетворює модель у формат потрібний іншому шару
    public static string? TryMapPublicUrlToPhysicalPath(IWebHostEnvironment env, string? publicUrl)
    {
        if (!IsManagedPublicUrl(publicUrl)) return null;

        var normalizedPublicUrl = MediaUrlPolicy.NormalizePublicUrl(publicUrl)!;
        var normalized = normalizedPublicUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var candidate = Path.GetFullPath(Path.Combine(env.WebRootPath, normalized));
        var root = Path.GetFullPath(env.WebRootPath);

        if (!candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            return null;

        return candidate;
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public static bool TryDeleteManagedFile(IWebHostEnvironment env, string? publicUrl)
    {
        var physicalPath = TryMapPublicUrlToPhysicalPath(env, publicUrl);
        if (physicalPath == null || !System.IO.File.Exists(physicalPath)) return false;

        try
        {
            System.IO.File.Delete(physicalPath);
            TemporaryUploadRegistry.Remove(publicUrl);
            return true;
        }
        catch
        {
            return false;
        }
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public static async Task<bool> DeleteIfUnreferencedAsync(IWebHostEnvironment env, ApplicationDbContext db, string? publicUrl, CancellationToken cancellationToken = default)
    {
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (!IsManagedPublicUrl(normalized)) return false;
        if (await IsReferencedAsync(db, normalized, cancellationToken)) return false;
        return TryDeleteManagedFile(env, normalized);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static async Task<bool> IsReferencedAsync(ApplicationDbContext db, string? publicUrl, CancellationToken cancellationToken = default)
    {
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (normalized == null || !IsManagedPublicUrl(normalized)) return false;

        return await db.UserProfiles.AsNoTracking().AnyAsync(x => x.AvatarUrl == normalized, cancellationToken)
            || await db.Artists.AsNoTracking().AnyAsync(x => x.AvatarUrl == normalized || x.CoverUrl == normalized, cancellationToken)
            || await db.Playlists.AsNoTracking().AnyAsync(x => x.CoverUrl == normalized, cancellationToken)
            || await db.Tracks.AsNoTracking().AnyAsync(x => x.AudioUrl == normalized || x.CoverUrl == normalized, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static async Task<bool> CanUserManageFileAsync(ApplicationDbContext db, string userId, bool isAdmin, string? publicUrl, CancellationToken cancellationToken = default)
    {
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (normalized == null || !IsManagedPublicUrl(normalized) || string.IsNullOrWhiteSpace(userId)) return false;
        if (isAdmin) return true;

        return await db.UserProfiles.AsNoTracking().AnyAsync(x => x.UserId == userId && x.AvatarUrl == normalized, cancellationToken)
            || await db.Artists.AsNoTracking().AnyAsync(x => x.OwnerLink != null && x.OwnerLink.UserId == userId && (x.AvatarUrl == normalized || x.CoverUrl == normalized), cancellationToken)
            || await db.Playlists.AsNoTracking().AnyAsync(x => x.UserId == userId && x.CoverUrl == normalized, cancellationToken)
            || await db.Tracks.AsNoTracking().AnyAsync(x => x.Artist.OwnerLink != null && x.Artist.OwnerLink.UserId == userId && (x.AudioUrl == normalized || x.CoverUrl == normalized), cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static async Task<int> CleanupOrphanedFilesAsync(IWebHostEnvironment env, ApplicationDbContext db, TimeSpan olderThan, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(env.WebRootPath) || !Directory.Exists(env.WebRootPath)) return 0;

        TemporaryUploadRegistry.CleanupOlderThan(olderThan);
        var threshold = DateTime.UtcNow.Subtract(olderThan);
        var deleted = 0;

        foreach (var relativeFolder in AllowedPublicPrefixes)
        {
            var folderPath = Path.Combine(env.WebRootPath, relativeFolder.Replace('/', Path.DirectorySeparatorChar).TrimEnd(Path.DirectorySeparatorChar));
            if (!Directory.Exists(folderPath)) continue;

            foreach (var filePath in Directory.EnumerateFiles(folderPath, "*", SearchOption.TopDirectoryOnly))
            {
                cancellationToken.ThrowIfCancellationRequested();

                FileInfo fileInfo;
                try
                {
                    fileInfo = new FileInfo(filePath);
                }
                catch
                {
                    continue;
                }

                if (fileInfo.LastWriteTimeUtc > threshold) continue;

                var relativePath = Path.GetRelativePath(env.WebRootPath, filePath).Replace('\\', '/');
                var publicUrl = "/" + relativePath.TrimStart('/');
                if (await IsReferencedAsync(db, publicUrl, cancellationToken)) continue;

                if (TryDeleteManagedFile(env, publicUrl))
                    deleted++;
            }
        }

        return deleted;
    }
}
