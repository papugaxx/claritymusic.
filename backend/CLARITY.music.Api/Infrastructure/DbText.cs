

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure;




public static class DbText
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string CaseInsensitiveCollation = "SQL_Latin1_General_CP1_CI_AS";

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public static bool ContainsUniqueConstraint(DbUpdateException ex, params string[] markers)
    {
        var text = ex.InnerException?.Message ?? ex.Message;
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        if (text.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase)
            || text.Contains("duplicate", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return markers.Any(marker => text.Contains(marker, StringComparison.OrdinalIgnoreCase));
    }
}
