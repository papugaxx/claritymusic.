

// Нижче підключаються простори назв які потрібні цьому модулю

using System;

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class ArtistFollow
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public string UserId { get; set; } = default!;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int ArtistId { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Властивість нижче зберігає значення яке читають інші частини системи
    public Artist Artist { get; set; } = default!;
}
