

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class Artist
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Slug { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public List<Track> Tracks { get; set; } = new();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public ArtistOwner? OwnerLink { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public List<ArtistFollow> Followers { get; set; } = new();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
