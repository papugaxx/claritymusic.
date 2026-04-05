

// Нижче підключаються простори назв які потрібні цьому модулю

using System.ComponentModel.DataAnnotations;

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public class AdminTrackSaveRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Track title is required")]
    [StringLength(120, MinimumLength = 1, ErrorMessage = "Track title must contain between 1 and 120 characters")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Title { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Artist selection is required")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int ArtistId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Genre selection is required")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int GenreId { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public int? MoodId { get; set; }

    [Range(1, 3600, ErrorMessage = "Track duration must be between 1 and 3600 seconds")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int DurationSec { get; set; }

    [Required(AllowEmptyStrings = false, ErrorMessage = "Upload an audio file first")]
    [StringLength(500, ErrorMessage = "Audio URL is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AudioUrl { get; set; }

    [StringLength(500, ErrorMessage = "Cover URL is too long")]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsActive { get; set; } = true;
}
