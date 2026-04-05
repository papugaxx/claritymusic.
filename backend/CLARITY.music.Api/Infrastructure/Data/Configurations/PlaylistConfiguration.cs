

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class PlaylistConfiguration : IEntityTypeConfiguration<Playlist>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<Playlist> builder)
    {
        
        builder.Property(item => item.Name).IsRequired().HasMaxLength(100);
        builder.Property(item => item.UserId).IsRequired();
        builder.Property(item => item.CoverUrl).HasMaxLength(500);

        builder.HasIndex(item => item.UserId);
        builder.HasIndex(item => new { item.UserId, item.Name }).IsUnique();
    }
}
