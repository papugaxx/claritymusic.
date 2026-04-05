

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Options;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LookupCachingOptions
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string SectionName = "Caching:Lookups";

    // Властивість нижче зберігає значення яке читають інші частини системи
    public int PublicLookupsTtlSeconds { get; set; } = 300;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int AdminLookupsTtlSeconds { get; set; } = 180;
}
