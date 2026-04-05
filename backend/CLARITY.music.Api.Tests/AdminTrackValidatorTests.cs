

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services.Validation;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AdminTrackValidatorTests
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly AdminTrackValidator _validator = new();

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminTrackValidatorTests()
    {
        MediaUrlPolicy.Configure(allowExternalMedia: false);
    }

    [Fact]
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void Validate_ReturnsArtistError_WhenArtistIsMissing()
    {
        var request = new AdminTrackSaveRequest
        {
            ArtistId = 0,
            Title = "Track title",
            GenreId = 1,
            DurationSec = 180,
            AudioUrl = "/audio/test.mp3",
            CoverUrl = "/uploads/covers/test.webp"
        };

        var result = _validator.Validate(request);

        Assert.Equal("Artist selection is required", result);
    }

    [Fact]
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void Validate_AllowsMissingMood_ForAdminSaveFlow()
    {
        var request = new AdminTrackSaveRequest
        {
            ArtistId = 3,
            Title = "Track title",
            GenreId = 1,
            MoodId = null,
            DurationSec = 180,
            AudioUrl = "/audio/test.mp3",
            CoverUrl = "/uploads/covers/test.webp"
        };

        var result = _validator.Validate(request);

        Assert.Null(result);
    }
}
