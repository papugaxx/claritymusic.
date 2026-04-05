

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackPlayConfiguration : IEntityTypeConfiguration<TrackPlay>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<TrackPlay> builder)
    {
        
        builder.Property(item => item.UserId).IsRequired();

        builder.HasOne(item => item.Track)
            .WithMany()
            .HasForeignKey(item => item.TrackId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(item => item.UserId);
        builder.HasIndex(item => new { item.UserId, item.PlayedAt });
        builder.HasIndex(item => new { item.UserId, item.TrackId });
    }
}
