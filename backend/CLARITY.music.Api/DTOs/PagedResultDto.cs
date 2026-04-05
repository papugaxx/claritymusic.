

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class PagedResultDto<T>
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Skip { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int Take { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int TotalCount { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool HasMore { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int? NextSkip { get; init; }
}




public static class PagedResult
{
    public static PagedResultDto<T> Create<T>(IReadOnlyList<T> items, int totalCount, int skip, int take)
    {
        var safeItems = items ?? Array.Empty<T>();
        var safeTotalCount = Math.Max(0, totalCount);
        var safeSkip = Math.Max(0, skip);
        var safeTake = Math.Max(0, take);
        var consumed = safeSkip + safeItems.Count;
        var hasMore = consumed < safeTotalCount;

        return new PagedResultDto<T>
        {
            Items = safeItems,
            Skip = safeSkip,
            Take = safeTake,
            TotalCount = safeTotalCount,
            HasMore = hasMore,
            NextSkip = hasMore ? consumed : null,
        };
    }
}
