

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Linq.Expressions;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Infrastructure.Queries;




public static class ArtistProjections
{
    public static Expression<Func<Artist, ArtistPublicDto>> ToPublicDto()
    {
        
        return artist => new ArtistPublicDto
        {
            Id = artist.Id,
            Name = artist.Name,
            AvatarUrl = artist.AvatarUrl,
            CoverUrl = artist.CoverUrl,
            Slug = artist.Slug,
        };
    }

    public static Expression<Func<Artist, ArtistDetailsDto>> ToDetailsDto(string? currentUserId)
    {
        
        var safeUserId = string.IsNullOrWhiteSpace(currentUserId) ? null : currentUserId.Trim();
        return artist => new ArtistDetailsDto
        {
            Id = artist.Id,
            Name = artist.Name,
            AvatarUrl = artist.AvatarUrl,
            CoverUrl = artist.CoverUrl,
            Slug = artist.Slug,
            FollowersCount = artist.Followers.Count,
            IsFollowing = safeUserId != null && artist.Followers.Any(follow => follow.UserId == safeUserId),
            IsOwnedByCurrentUser = safeUserId != null && artist.OwnerLink != null && artist.OwnerLink.UserId == safeUserId,
        };
    }

    public static Expression<Func<Artist, ArtistAdminDto>> ToAdminDto()
    {
        
        return artist => new ArtistAdminDto
        {
            Id = artist.Id,
            Name = artist.Name,
            Slug = artist.Slug,
            AvatarUrl = artist.AvatarUrl,
            CoverUrl = artist.CoverUrl,
            OwnerUserId = artist.OwnerLink == null ? null : artist.OwnerLink.UserId,
            TracksCount = artist.Tracks.Count,
            FollowersCount = artist.Followers.Count,
        };
    }
}
