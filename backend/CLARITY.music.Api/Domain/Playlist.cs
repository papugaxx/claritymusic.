

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class Playlist
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; set; } = "";
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string UserId { get; set; } = "";
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public List<PlaylistTrack> PlaylistTracks { get; set; } = new();
}
