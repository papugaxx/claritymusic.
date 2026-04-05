

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure;




public static class PaginationExtensions
{
    public static async Task<PagedResultDto<T>> ToPagedResultAsync<T>(this IQueryable<T> query, int skip, int take, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var totalCount = await query.CountAsync(queryCancellationToken);
        var items = await query.Skip(skip).Take(take).ToListAsync(queryCancellationToken);
        return PagedResult.Create(items, totalCount, skip, take);
    }
}
