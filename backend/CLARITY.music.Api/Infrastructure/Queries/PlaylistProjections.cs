

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Linq.Expressions;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Queries;




public static class PlaylistProjections
{
    public static Expression<Func<Playlist, PlaylistSummaryDto>> ToSummaryDtoExpression()
    {
        
        return playlist => new PlaylistSummaryDto
        {
            Id = playlist.Id,
            Name = playlist.Name,
            CreatedAt = playlist.CreatedAt,
            CoverUrl = playlist.CoverUrl,
        };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static PlaylistSummaryDto ToSummaryDto(Playlist playlist)
    {
        
        return new PlaylistSummaryDto
        {
            Id = playlist.Id,
            Name = playlist.Name,
            CreatedAt = playlist.CreatedAt,
            CoverUrl = playlist.CoverUrl,
        };
    }

    public static Expression<Func<PlaylistTrack, PlaylistTrackListItemDto>> ToTrackListItemDto()
    {
        
        return item => new PlaylistTrackListItemDto
        {
            Id = item.Track.Id,
            Title = item.Track.Title,
            DurationSec = item.Track.DurationSec,
            PlaysCount = item.Track.PlaysCount,
            AudioUrl = item.Track.AudioUrl,
            CoverUrl = item.Track.CoverUrl,
            IsActive = item.Track.IsActive,
            AddedAt = item.CreatedAt,
            TrackCreatedAt = item.Track.CreatedAt,
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

    // Метод нижче виконує окрему частину логіки цього модуля
    public static string NormalizeTrackSort(string? sort)
    {
        return (sort ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "added_asc" => "added_asc",
            "track_date_desc" => "track_date_desc",
            "plays_desc" => "plays_desc",
            "duration_desc" => "duration_desc",
            _ => "added_desc",
        };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static IQueryable<PlaylistTrack> ApplyTrackSort(IQueryable<PlaylistTrack> query, string normalizedSort)
    {
        return normalizedSort switch
        {
            "added_asc" => query.OrderBy(item => item.CreatedAt).ThenBy(item => item.TrackId),
            "track_date_desc" => query.OrderByDescending(item => item.Track.CreatedAt).ThenByDescending(item => item.CreatedAt),
            "plays_desc" => query.OrderByDescending(item => item.Track.PlaysCount).ThenByDescending(item => item.CreatedAt),
            "duration_desc" => query.OrderByDescending(item => item.Track.DurationSec).ThenByDescending(item => item.CreatedAt),
            _ => query.OrderByDescending(item => item.CreatedAt).ThenByDescending(item => item.TrackId),
        };
    }
}
