

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Options;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class GoogleAuthOptions
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string SectionName = "Authentication:Google";

    // Властивість нижче зберігає значення яке читають інші частини системи
    public string ClientId { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string ClientSecret { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string CallbackPath { get; set; } = "/signin-google";
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string FrontendCallbackPath { get; set; } = "/auth/google/callback";

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(ClientId)
            && !string.IsNullOrWhiteSpace(ClientSecret);
    }
}
