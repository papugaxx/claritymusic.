

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public class TrackStatusUpdateRequest
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsActive { get; set; }
}
