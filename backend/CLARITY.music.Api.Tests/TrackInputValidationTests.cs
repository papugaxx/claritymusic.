

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services.Validation;
using CLARITY.music.Api.Infrastructure;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackInputValidationTests
{
    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackInputValidationTests()
    {
        MediaUrlPolicy.Configure(allowExternalMedia: false);
    }

    [Fact]
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void Validate_ReturnsNull_ForManagedUrlsAndValidPayload()
    {
        var result = TrackInputValidation.Validate(
            title: "Track title",
            genreId: 1,
            moodId: 2,
            durationSec: 180,
            audioUrl: "/audio/test.mp3",
            coverUrl: "/uploads/covers/test.webp");

        Assert.Null(result);
    }

    [Fact]
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void Validate_ReturnsMoodError_WhenMoodIsRequired()
    {
        var result = TrackInputValidation.Validate(
            title: "Track title",
            genreId: 1,
            moodId: null,
            durationSec: 180,
            audioUrl: "/audio/test.mp3",
            coverUrl: "/uploads/covers/test.webp");

        Assert.Equal("Mood selection is required", result);
    }

    [Fact]
    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public void Validate_ReturnsAudioError_WhenAudioUrlIsInvalid()
    {
        var result = TrackInputValidation.Validate(
            title: "Track title",
            genreId: 1,
            moodId: 2,
            durationSec: 180,
            audioUrl: "/uploads/covers/not-audio.webp",
            coverUrl: "/uploads/covers/test.webp");

        Assert.Equal("Invalid audio file URL", result);
    }
}
