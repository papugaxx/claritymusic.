

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Domain
{
    
    
    
    // Клас нижче описує сутність або правило предметної області
    public class LikedTrack
    {
        // Властивість нижче зберігає значення яке читають інші частини системи
        public int Id { get; set; }

        // Властивість нижче зберігає значення яке читають інші частини системи
        public string UserId { get; set; } = null!;
        // Властивість нижче зберігає значення яке читають інші частини системи
        public IdentityUser User { get; set; } = null!;

        // Властивість нижче зберігає значення яке читають інші частини системи
        public int TrackId { get; set; }
        // Властивість нижче зберігає значення яке читають інші частини системи
        public Track Track { get; set; } = null!;

        // Властивість нижче зберігає значення яке читають інші частини системи
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
