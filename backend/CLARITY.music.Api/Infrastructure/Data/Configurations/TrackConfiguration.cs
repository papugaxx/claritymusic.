

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackConfiguration : IEntityTypeConfiguration<Track>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<Track> builder)
    {
        
        builder.Property(item => item.Title).IsRequired().HasMaxLength(120);
        builder.Property(item => item.AudioUrl).IsRequired().HasMaxLength(500);

        builder.HasOne(item => item.Artist)
            .WithMany(artist => artist.Tracks)
            .HasForeignKey(item => item.ArtistId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(item => item.Genre)
            .WithMany(genre => genre.Tracks)
            .HasForeignKey(item => item.GenreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(item => item.Mood)
            .WithMany(mood => mood.Tracks)
            .HasForeignKey(item => item.MoodId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(item => item.ArtistId);
        builder.HasIndex(item => item.GenreId);
        builder.HasIndex(item => item.MoodId);
        builder.HasIndex(item => item.PlaysCount);
    }
}
