

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public class UploadResultDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Url { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Kind { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AudioUrl { get; set; }
}
