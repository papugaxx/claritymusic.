

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CLARITY.music.Api.Infrastructure.Data.Configurations;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class MoodConfiguration : IEntityTypeConfiguration<Mood>
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public void Configure(EntityTypeBuilder<Mood> builder)
    {
        
        builder.Property(item => item.Name).IsRequired().HasMaxLength(50);
        builder.HasIndex(item => item.Name).IsUnique();
    }
}
