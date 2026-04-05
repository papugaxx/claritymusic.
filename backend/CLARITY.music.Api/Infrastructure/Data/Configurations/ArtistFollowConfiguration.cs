

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistFollowConfiguration : IEntityTypeConfiguration<ArtistFollow>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<ArtistFollow> builder)
    {
        
        builder.HasIndex(item => new { item.UserId, item.ArtistId }).IsUnique();

        builder.HasOne(item => item.Artist)
            .WithMany(artist => artist.Followers)
            .HasForeignKey(item => item.ArtistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
