

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Infrastructure;

public readonly record struct PagingBounds(int Take, int Skip)
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static PagingBounds Normalize(int take, int skip, int defaultTake, int maxTake)
    {
        var normalizedTake = take < 1 ? defaultTake : Math.Min(take, maxTake);
        var normalizedSkip = Math.Max(0, skip);
        return new PagingBounds(normalizedTake, normalizedSkip);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static int NormalizeTake(int take, int defaultTake, int maxTake)
    {
        return take < 1 ? defaultTake : Math.Min(take, maxTake);
    }
}
