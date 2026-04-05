

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistOwnerConfiguration : IEntityTypeConfiguration<ArtistOwner>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<ArtistOwner> builder)
    {
        
        builder.HasKey(item => new { item.UserId, item.ArtistId });

        builder.HasIndex(item => item.ArtistId).IsUnique();
        builder.HasIndex(item => item.UserId).IsUnique();

        builder.HasOne(item => item.Artist)
            .WithOne(artist => artist.OwnerLink)
            .HasForeignKey<ArtistOwner>(item => item.ArtistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
