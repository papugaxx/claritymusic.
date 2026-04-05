

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public class ArtistPublicDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Id { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Slug { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public class ArtistDetailsDto : ArtistPublicDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int FollowersCount { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsFollowing { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsOwnedByCurrentUser { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public class ArtistAdminDto : ArtistPublicDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? OwnerUserId { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int TracksCount { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int FollowersCount { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public class FollowingArtistDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int ArtistId { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string ArtistName { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime CreatedAt { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public class UserProfileDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string UserId { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string DisplayName { get; set; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DateTime? UpdatedAt { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ArtistFollowStateDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Followed { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int FollowersCount { get; init; }
}
