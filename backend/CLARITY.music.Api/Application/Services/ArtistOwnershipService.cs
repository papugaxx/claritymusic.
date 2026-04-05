

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Commands;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public class ArtistOwnershipService : IArtistOwnershipService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly IDbContextFactory<ApplicationDbContext> _dbFactory;
    private readonly UserManager<IdentityUser> _userManager;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistOwnershipService(
        ApplicationDbContext db,
        IDbContextFactory<ApplicationDbContext> dbFactory,
        UserManager<IdentityUser> userManager)
    {
        
        _db = db;
        _dbFactory = dbFactory;
        _userManager = userManager;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<int?> GetOwnedArtistIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        await using var db = await _dbFactory.CreateDbContextAsync(CancellationToken.None);
        return await db.ArtistOwners
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (int?)x.ArtistId)
            .FirstOrDefaultAsync(CancellationToken.None);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<string?> GetOwnerUserIdAsync(int artistId, CancellationToken cancellationToken = default)
    {
        if (artistId <= 0)
            return null;

        await using var db = await _dbFactory.CreateDbContextAsync(CancellationToken.None);
        return await db.ArtistOwners
            .AsNoTracking()
            .Where(x => x.ArtistId == artistId)
            .Select(x => x.UserId)
            .FirstOrDefaultAsync(CancellationToken.None);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<bool> IsOwnerAsync(string userId, int artistId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId) || artistId <= 0)
            return false;

        await using var db = await _dbFactory.CreateDbContextAsync(CancellationToken.None);
        return await db.ArtistOwners
            .AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.ArtistId == artistId, CancellationToken.None);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task SetOwnerAsync(int artistId, string? ownerUserId, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        if (artistId <= 0)
            throw new ArgumentOutOfRangeException(nameof(artistId));

        var normalizedOwnerUserId = string.IsNullOrWhiteSpace(ownerUserId) ? null : ownerUserId.Trim();

        var currentRows = await _db.ArtistOwners
            .Where(x => x.ArtistId == artistId || (normalizedOwnerUserId != null && x.UserId == normalizedOwnerUserId))
            .ToListAsync(writeCancellationToken);

        var affectedUserIds = currentRows
            .Select(x => x.UserId)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (currentRows.Count > 0)
            _db.ArtistOwners.RemoveRange(currentRows);

        if (normalizedOwnerUserId != null)
        {
            _db.ArtistOwners.Add(new ArtistOwner
            {
                ArtistId = artistId,
                UserId = normalizedOwnerUserId,
                CreatedAt = DateTime.UtcNow,
            });

            if (!affectedUserIds.Contains(normalizedOwnerUserId, StringComparer.Ordinal))
                affectedUserIds.Add(normalizedOwnerUserId);
        }

        await _db.SaveChangesAsync(writeCancellationToken);

        foreach (var userId in affectedUserIds)
            await SyncArtistRoleAsync(userId, writeCancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task SyncArtistRoleAsync(string userId, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        if (string.IsNullOrWhiteSpace(userId))
            return;

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return;

        var ownsArtist = await _db.ArtistOwners
            .AsNoTracking()
            .AnyAsync(x => x.UserId == userId, writeCancellationToken);

        var isArtist = await _userManager.IsInRoleAsync(user, "Artist");

        if (ownsArtist && !isArtist)
        {
            var addResult = await _userManager.AddToRoleAsync(user, "Artist");
            if (!addResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join("; ", addResult.Errors.Select(error => error.Description)));
            }

            return;
        }

        if (!ownsArtist && isArtist)
        {
            var removeResult = await _userManager.RemoveFromRoleAsync(user, "Artist");
            if (!removeResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join("; ", removeResult.Errors.Select(error => error.Description)));
            }
        }
    }
}
