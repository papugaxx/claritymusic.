

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Options;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AuthFlowOptions
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string SectionName = "AuthFlow";

    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? PublicAppBaseUrl { get; set; }
}
