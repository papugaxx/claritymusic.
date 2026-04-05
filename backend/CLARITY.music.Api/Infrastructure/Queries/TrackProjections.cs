

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Linq.Expressions;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Queries;




public static class TrackProjections
{
    public static Expression<Func<Track, TrackDto>> ToDto()
    {
        
        return track => new TrackDto
        {
            Id = track.Id,
            Title = track.Title,
            DurationSec = track.DurationSec,
            PlaysCount = track.PlaysCount,
            AudioUrl = track.AudioUrl,
            CoverUrl = track.CoverUrl,
            IsActive = track.IsActive,
            CreatedAt = track.CreatedAt,
            Artist = new ArtistDto
            {
                Id = track.Artist.Id,
                Name = track.Artist.Name,
                AvatarUrl = track.Artist.AvatarUrl,
                CoverUrl = track.Artist.CoverUrl,
            },
            Genre = new GenreDto
            {
                Id = track.Genre.Id,
                Name = track.Genre.Name,
            },
            Mood = track.Mood == null ? null : new MoodDto
            {
                Id = track.Mood.Id,
                Name = track.Mood.Name,
            },
        };
    }
}
