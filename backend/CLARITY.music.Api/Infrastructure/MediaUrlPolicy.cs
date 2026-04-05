

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Text.RegularExpressions;

namespace CLARITY.music.Api.Infrastructure;

public static partial class MediaUrlPolicy
{
    private static volatile bool _allowExternalMedia;
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static string[] _allowedExternalHosts = Array.Empty<string>();

    private static readonly string[] ManagedImagePrefixes =
    [
        "/uploads/avatars/",
        "/uploads/covers/",
        "/uploads/playlist-covers/"
    ];

    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly string[] ManagedAudioPrefixes =
    [
        "/audio/"
    ];

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    // Метод нижче виконує окрему частину логіки цього модуля
    private static partial Regex SlugPattern();

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsManagedImageUrl(string? value) => IsManagedUrlWithPrefixes(value, ManagedImagePrefixes);

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsManagedAudioUrl(string? value) => IsManagedUrlWithPrefixes(value, ManagedAudioPrefixes);

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsManagedUrlWithPrefixes(string? value, params string[] prefixes)
    {
        var normalized = NormalizePublicUrl(value);
        if (normalized == null) return false;
        return prefixes.Any(prefix => normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static string? NormalizePublicUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var normalized = value.Trim().Replace('\\', '/');
        if (normalized.StartsWith("~/", StringComparison.Ordinal)) normalized = normalized[1..];
        if (!normalized.StartsWith('/'))
        {
            if (normalized.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || normalized.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return normalized;

            normalized = "/" + normalized.TrimStart('/');
        }

        while (normalized.Contains("//", StringComparison.Ordinal))
            normalized = normalized.Replace("//", "/", StringComparison.Ordinal);

        return normalized;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static void Configure(bool allowExternalMedia, IEnumerable<string>? allowedExternalHosts = null)
    {
        _allowExternalMedia = allowExternalMedia;
        _allowedExternalHosts = (allowedExternalHosts ?? Array.Empty<string>())
            .Select(x => x?.Trim().ToLowerInvariant())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray()!;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsSafeExternalHttpUrl(string? value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)) return false;

        var isLoopback = uri.IsLoopback
            || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);

        if (uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase))
            return isLoopback;

        if (!uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
            return false;

        if (isLoopback)
            return true;

        if (!_allowExternalMedia)
            return false;

        return _allowedExternalHosts.Contains(uri.Host.Trim().ToLowerInvariant(), StringComparer.OrdinalIgnoreCase);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsSafePersistedImageUrl(string? value)
    {
        var normalized = NormalizePublicUrl(value);
        if (normalized == null) return true;
        if (IsManagedImageUrl(normalized)) return true;
        if (!IsSafeExternalHttpUrl(normalized)) return false;
        return normalized.Length <= 500;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsSafePersistedAudioUrl(string? value)
    {
        var normalized = NormalizePublicUrl(value);
        if (normalized == null) return false;
        if (IsManagedAudioUrl(normalized)) return true;
        if (!IsSafeExternalHttpUrl(normalized)) return false;

        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri)) return false;
        return uri.AbsolutePath.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static bool IsValidSlug(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        return SlugPattern().IsMatch(value.Trim());
    }
}
