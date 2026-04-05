

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Options;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class EmailDeliveryOptions
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string SectionName = "Email";

    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Provider { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string FromEmail { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string FromName { get; set; } = "CLARITY.music";
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string ReplyToEmail { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string ReplyToName { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public SmtpEmailOptions Smtp { get; set; } = new();

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool UseSmtpProvider()
    {
        return string.Equals(Provider?.Trim(), "smtp", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(FromEmail)
            && Smtp.IsConfigured();
    }
}




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class SmtpEmailOptions
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Host { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Port { get; set; } = 587;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Username { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Password { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool EnableSsl { get; set; } = true;

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(Host)
            && Port > 0
            && !string.IsNullOrWhiteSpace(Username)
            && !string.IsNullOrWhiteSpace(Password);
    }
}
