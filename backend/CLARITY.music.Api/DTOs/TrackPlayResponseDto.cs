

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class TrackPlayResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int TrackId { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int PlaysCount { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Deduped { get; init; }
}
