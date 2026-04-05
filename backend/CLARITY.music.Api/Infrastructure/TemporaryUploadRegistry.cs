

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Collections.Concurrent;

namespace CLARITY.music.Api.Infrastructure;




public static class TemporaryUploadRegistry
{
    // Record нижче задає компактну форму даних для передачі між шарами
    private sealed record Entry(string UserId, DateTime CreatedAtUtc);

    private static readonly ConcurrentDictionary<string, Entry> Entries = new(StringComparer.OrdinalIgnoreCase);

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public static void Register(string userId, string? publicUrl)
    {
        
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (string.IsNullOrWhiteSpace(userId) || !ManagedUploadFiles.IsManagedPublicUrl(normalized)) return;
        Entries[normalized!] = new Entry(userId, DateTime.UtcNow);
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public static bool CanDelete(string userId, bool isAdmin, string? publicUrl)
    {
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (normalized == null || !ManagedUploadFiles.IsManagedPublicUrl(normalized)) return false;
        if (isAdmin) return true;
        return Entries.TryGetValue(normalized, out var entry) && string.Equals(entry.UserId, userId, StringComparison.Ordinal);
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public static void Remove(string? publicUrl)
    {
        
        var normalized = MediaUrlPolicy.NormalizePublicUrl(publicUrl);
        if (normalized == null) return;
        Entries.TryRemove(normalized, out _);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static void CleanupOlderThan(TimeSpan olderThan)
    {
        var threshold = DateTime.UtcNow.Subtract(olderThan);
        foreach (var pair in Entries)
        {
            if (pair.Value.CreatedAtUtc < threshold)
                Entries.TryRemove(pair.Key, out _);
        }
    }
}
