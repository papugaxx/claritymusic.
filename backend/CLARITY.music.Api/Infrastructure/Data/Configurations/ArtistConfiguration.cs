

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistConfiguration : IEntityTypeConfiguration<Artist>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<Artist> builder)
    {
        
        builder.Property(item => item.Name).IsRequired().HasMaxLength(100);
        builder.HasIndex(item => item.Name).IsUnique();

        builder.Property(item => item.AvatarUrl).HasMaxLength(500);
        builder.Property(item => item.CoverUrl).HasMaxLength(500);
        builder.Property(item => item.Slug).HasMaxLength(120);
        builder.HasIndex(item => item.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
    }
}
