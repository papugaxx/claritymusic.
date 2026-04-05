

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class ArtistOwner
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string UserId { get; set; } = null!;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int ArtistId { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public Artist Artist { get; set; } = null!;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public Microsoft.AspNetCore.Identity.IdentityUser User { get; set; } = null!;

    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
