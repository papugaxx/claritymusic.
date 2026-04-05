

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class MediaUrlPolicyTests
{
    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void IsSafePersistedImageUrl_AllowsManagedImageUrls()
    {
        MediaUrlPolicy.Configure(allowExternalMedia: false);

        var result = MediaUrlPolicy.IsSafePersistedImageUrl("/uploads/covers/cover.webp");

        Assert.True(result);
    }

    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void IsSafePersistedAudioUrl_AllowsConfiguredHttpsHostWithMp3()
    {
        MediaUrlPolicy.Configure(allowExternalMedia: true, allowedExternalHosts: ["cdn.example.com"]);

        var result = MediaUrlPolicy.IsSafePersistedAudioUrl("https://cdn.example.com/audio/demo.mp3");

        Assert.True(result);
    }

    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void IsSafePersistedAudioUrl_RejectsUnknownExternalHost()
    {
        MediaUrlPolicy.Configure(allowExternalMedia: true, allowedExternalHosts: ["cdn.example.com"]);

        var result = MediaUrlPolicy.IsSafePersistedAudioUrl("https://evil.example.com/audio/demo.mp3");

        Assert.False(result);
    }
}
