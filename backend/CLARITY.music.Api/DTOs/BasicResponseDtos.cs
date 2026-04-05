

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class OperationResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Ok { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Message { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class DeletionResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Deleted { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int? Id { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class RemovalResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Removed { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ExistenceResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Exists { get; init; }
}
