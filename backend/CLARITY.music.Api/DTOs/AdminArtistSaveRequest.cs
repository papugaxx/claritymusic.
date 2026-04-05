

// Нижче підключаються простори назв які потрібні цьому модулю

using System.ComponentModel.DataAnnotations;

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class AdminArtistSaveRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Artist name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Artist name must contain between 2 and 100 characters")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Name { get; set; }

    [StringLength(120, ErrorMessage = "Slug cannot be longer than 120 characters")]
    [RegularExpression(@"^$|^[a-z0-9-]+$", ErrorMessage = "Slug can contain only Latin letters, digits, and hyphens")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Slug { get; set; }

    [StringLength(500, ErrorMessage = "Avatar URL is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }

    [StringLength(500, ErrorMessage = "Cover URL is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }

    [StringLength(450, ErrorMessage = "OwnerUserId is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? OwnerUserId { get; set; }
}
