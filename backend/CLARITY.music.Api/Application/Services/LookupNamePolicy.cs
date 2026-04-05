

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




public static class LookupNamePolicy
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static string? Normalize(string? value, int minLength = 2, int maxLength = 50)
    {
        var normalized = (value ?? string.Empty).Trim();
        return normalized.Length >= minLength && normalized.Length <= maxLength ? normalized : null;
    }
}
