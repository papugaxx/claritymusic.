

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class LookupItemDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; init; } = string.Empty;
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class NamedLookupSaveRequest
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Name { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class AdminLookupsResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<LookupItemDto> Artists { get; init; } = Array.Empty<LookupItemDto>();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<LookupItemDto> Genres { get; init; } = Array.Empty<LookupItemDto>();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<LookupItemDto> Moods { get; init; } = Array.Empty<LookupItemDto>();
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PublicLookupsResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<LookupItemDto> Genres { get; init; } = Array.Empty<LookupItemDto>();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<LookupItemDto> Moods { get; init; } = Array.Empty<LookupItemDto>();
}
