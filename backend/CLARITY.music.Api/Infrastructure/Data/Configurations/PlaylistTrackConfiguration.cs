

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class PlaylistTrackConfiguration : IEntityTypeConfiguration<PlaylistTrack>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<PlaylistTrack> builder)
    {
        
        builder.HasKey(item => new { item.PlaylistId, item.TrackId });

        builder.HasOne(item => item.Playlist)
            .WithMany(playlist => playlist.PlaylistTracks)
            .HasForeignKey(item => item.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(item => item.Track)
            .WithMany()
            .HasForeignKey(item => item.TrackId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(item => item.TrackId);
    }
}
