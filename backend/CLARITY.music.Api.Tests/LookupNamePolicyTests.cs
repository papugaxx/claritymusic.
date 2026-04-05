

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LookupNamePolicyTests
{
    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Normalize_TrimsAndReturnsValue_WhenLengthIsValid()
    {
        var result = LookupNamePolicy.Normalize("  Rock  ");

        Assert.Equal("Rock", result);
    }

    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Normalize_ReturnsNull_WhenValueIsTooShort()
    {
        var result = LookupNamePolicy.Normalize(" a ");

        Assert.Null(result);
    }
}
