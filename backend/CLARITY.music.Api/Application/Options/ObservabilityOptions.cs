

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Options;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ObservabilityOptions
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string SectionName = "Observability";

    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool EnableApiRequestLogging { get; set; } = true;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int SlowRequestWarningMs { get; set; } = 1500;
}
