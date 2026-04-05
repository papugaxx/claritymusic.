

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ApiErrorResponse
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Error { get; init; } = string.Empty;

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public static ApiErrorResponse Create(string error)
    {
        
        return new ApiErrorResponse
        {
            Error = error,
        };
    }
}
