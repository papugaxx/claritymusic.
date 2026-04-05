

// Нижче підключаються простори назв які потрібні цьому модулю

using System.ComponentModel.DataAnnotations;

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class MeProfileUpdateRequest
{
    [StringLength(80, ErrorMessage = "Profile name cannot be longer than 80 characters")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? DisplayName { get; set; }

    [StringLength(500, ErrorMessage = "Avatar URL is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
}
