

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Linq.Expressions;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Queries;




public static class LookupProjections
{
    public static Expression<Func<Artist, LookupItemDto>> ToArtistDto()
    {
        
        return item => new LookupItemDto
        {
            Id = item.Id,
            Name = item.Name,
        };
    }

    public static Expression<Func<Genre, LookupItemDto>> ToGenreDto()
    {
        
        return item => new LookupItemDto
        {
            Id = item.Id,
            Name = item.Name,
        };
    }

    public static Expression<Func<Mood, LookupItemDto>> ToMoodDto()
    {
        
        return item => new LookupItemDto
        {
            Id = item.Id,
            Name = item.Name,
        };
    }
}
