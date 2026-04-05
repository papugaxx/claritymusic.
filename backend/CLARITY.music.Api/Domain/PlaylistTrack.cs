

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class PlaylistTrack
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int PlaylistId { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public Playlist Playlist { get; set; } = null!;

    // Властивість нижче зберігає значення яке читають інші частини системи
    public int TrackId { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public Track Track { get; set; } = null!;

    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
