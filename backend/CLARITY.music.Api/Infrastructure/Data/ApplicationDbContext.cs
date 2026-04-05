

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure.Data;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public class ApplicationDbContext : IdentityDbContext
{
    // Коментар коротко пояснює призначення наступного фрагмента
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        
    }

    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Mood> Moods => Set<Mood>();
    public DbSet<Track> Tracks => Set<Track>();
    // Властивість нижче зберігає значення яке читають інші частини системи
    public DbSet<LikedTrack> LikedTracks { get; set; } = null!;
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public DbSet<Playlist> Playlists => Set<Playlist>();
    public DbSet<PlaylistTrack> PlaylistTracks => Set<PlaylistTrack>();
    public DbSet<TrackPlay> TrackPlays => Set<TrackPlay>();
    public DbSet<ArtistFollow> ArtistFollows => Set<ArtistFollow>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<ArtistOwner> ArtistOwners => Set<ArtistOwner>();

    // Метод нижче виконує окрему частину логіки цього модуля
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<UserProfile>()
            .HasKey(x => x.UserId);

        builder.Entity<Artist>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => x.Name).IsUnique();

            e.Property(x => x.AvatarUrl).HasMaxLength(500);
            e.Property(x => x.CoverUrl).HasMaxLength(500);
            e.Property(x => x.Slug).HasMaxLength(120);
            e.HasIndex(x => x.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
        });

        builder.Entity<Genre>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<Mood>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<Track>(e =>
        {
            e.Property(x => x.Title).IsRequired().HasMaxLength(120);
            e.Property(x => x.AudioUrl).IsRequired().HasMaxLength(500);

            e.HasOne(x => x.Artist)
                .WithMany(a => a.Tracks)
                .HasForeignKey(x => x.ArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Genre)
                .WithMany(g => g.Tracks)
                .HasForeignKey(x => x.GenreId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Mood)
                .WithMany(m => m.Tracks)
                .HasForeignKey(x => x.MoodId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(x => x.ArtistId);
            e.HasIndex(x => x.GenreId);
            e.HasIndex(x => x.MoodId);
            e.HasIndex(x => x.PlaysCount);
        });

        builder.Entity<LikedTrack>()
            .HasIndex(x => new { x.UserId, x.TrackId })
            .IsUnique();

        builder.Entity<LikedTrack>()
            .HasOne(x => x.Track)
            .WithMany()
            .HasForeignKey(x => x.TrackId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<LikedTrack>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Playlist>(e =>
        {
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.UserId).IsRequired();
            e.Property(x => x.CoverUrl).HasMaxLength(500);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.Name }).IsUnique();
        });

        builder.Entity<ArtistFollow>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.ArtistId }).IsUnique();

            e.HasOne(x => x.Artist)
                .WithMany(a => a.Followers)
                .HasForeignKey(x => x.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlaylistTrack>(e =>
        {
            e.HasKey(x => new { x.PlaylistId, x.TrackId });

            e.HasOne(x => x.Playlist)
                .WithMany(p => p.PlaylistTracks)
                .HasForeignKey(x => x.PlaylistId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Track)
                .WithMany()
                .HasForeignKey(x => x.TrackId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.TrackId);
        });

        builder.Entity<TrackPlay>(e =>
        {
            e.Property(x => x.UserId).IsRequired();

            e.HasOne(x => x.Track)
                .WithMany()
                .HasForeignKey(x => x.TrackId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.PlayedAt });
            e.HasIndex(x => new { x.UserId, x.TrackId });
        });

        builder.Entity<ArtistOwner>(e =>
        {
            e.HasKey(x => new { x.UserId, x.ArtistId });

            e.HasIndex(x => x.ArtistId).IsUnique();
            e.HasIndex(x => x.UserId).IsUnique();

            e.HasOne(x => x.Artist)
                .WithOne(a => a.OwnerLink)
                .HasForeignKey<ArtistOwner>(x => x.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
