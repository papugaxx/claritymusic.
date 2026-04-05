

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PlaylistSummaryDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PlaylistDetailsDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public PagedResultDto<PlaylistTrackListItemDto> Tracks { get; init; } = new();
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PlaylistTrackListItemDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Title { get; init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int DurationSec { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int PlaysCount { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string AudioUrl { get; init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsActive { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime AddedAt { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime TrackCreatedAt { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public ArtistDto Artist { get; init; } = new();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public GenreDto Genre { get; init; } = new();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public MoodDto? Mood { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int? MoodId { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PlaylistTrackMutationResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Added { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Reason { get; init; }
}
