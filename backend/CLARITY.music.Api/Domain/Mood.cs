

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Domain;




// Клас нижче описує сутність або правило предметної області
public class Mood
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; set; }

    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; set; } = string.Empty;

    // Властивість нижче зберігає значення яке читають інші частини системи
    public ICollection<Track> Tracks { get; set; } = new List<Track>();
}
