

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LikedTrackConfiguration : IEntityTypeConfiguration<LikedTrack>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<LikedTrack> builder)
    {
        
        builder.HasIndex(item => new { item.UserId, item.TrackId }).IsUnique();

        builder.HasOne(item => item.Track)
            .WithMany()
            .HasForeignKey(item => item.TrackId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
