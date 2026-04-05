

// Нижче підключаються простори назв які потрібні цьому модулю

using System.ComponentModel.DataAnnotations;

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class UserProfile
{
    [Key]
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string UserId { get; set; } = default!;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string DisplayName { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
