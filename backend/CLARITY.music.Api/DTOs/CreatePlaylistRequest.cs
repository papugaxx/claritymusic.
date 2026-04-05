

// Нижче підключаються простори назв які потрібні цьому модулю

using System.ComponentModel.DataAnnotations;

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class CreatePlaylistRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Playlist name is required")]
    [StringLength(80, MinimumLength = 1, ErrorMessage = "Playlist name must contain between 1 and 80 characters")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Name { get; set; }
}
