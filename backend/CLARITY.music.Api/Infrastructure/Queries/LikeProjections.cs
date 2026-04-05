

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Linq.Expressions;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Queries;




public static class LikeProjections
{
    public static Expression<Func<LikedTrack, LikedTrackListItemDto>> ToListItemDto()
    {
        
        return item => new LikedTrackListItemDto
        {
            Id = item.Track.Id,
            Title = item.Track.Title,
            DurationSec = item.Track.DurationSec,
            PlaysCount = item.Track.PlaysCount,
            AudioUrl = item.Track.AudioUrl,
            CoverUrl = item.Track.CoverUrl,
            IsActive = item.Track.IsActive,
            CreatedAt = item.CreatedAt,
            Artist = new ArtistDto
            {
                Id = item.Track.Artist.Id,
                Name = item.Track.Artist.Name,
                AvatarUrl = item.Track.Artist.AvatarUrl,
                CoverUrl = item.Track.Artist.CoverUrl,
            },
            Genre = new GenreDto
            {
                Id = item.Track.Genre.Id,
                Name = item.Track.Genre.Name,
            },
            Mood = item.Track.Mood == null
                ? null
                : new MoodDto
                {
                    Id = item.Track.Mood.Id,
                    Name = item.Track.Mood.Name,
                },
            MoodId = item.Track.MoodId,
        };
    }
}
