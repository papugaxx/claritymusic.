

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistProfileValidationResult
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Succeeded { get; private init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Error { get; private init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Name { get; private init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Slug { get; private init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; private init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CoverUrl { get; private init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? OwnerUserId { get; private init; }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static ArtistProfileValidationResult Success(string name, string? slug, string? avatarUrl, string? coverUrl, string? ownerUserId)
    {
        return new ArtistProfileValidationResult
        {
            Succeeded = true,
            Name = name,
            Slug = slug,
            AvatarUrl = avatarUrl,
            CoverUrl = coverUrl,
            OwnerUserId = ownerUserId,
        };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static ArtistProfileValidationResult Failure(string error)
    {
        return new ArtistProfileValidationResult
        {
            Succeeded = false,
            Error = error,
        };
    }
}
