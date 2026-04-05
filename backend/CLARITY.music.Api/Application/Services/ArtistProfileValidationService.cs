

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ArtistProfileValidationService : IArtistProfileValidationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ArtistProfileValidationService(ApplicationDbContext db)
    {
        
        _db = db;
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public async Task<ArtistProfileValidationResult> ValidateAsync(
        string? name,
        string? slug,
        string? avatarUrl,
        string? coverUrl,
        int? currentArtistId,
        string? ownerUserId = null,
        bool validateOwnerUser = false,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = (name ?? string.Empty).Trim();
        if (normalizedName.Length < 2 || normalizedName.Length > 100)
        {
            return ArtistProfileValidationResult.Failure("Artist name must contain between 2 and 100 characters");
        }

        var normalizedSlug = string.IsNullOrWhiteSpace(slug)
            ? null
            : slug.Trim().ToLowerInvariant();

        if (normalizedSlug?.Length > 120)
        {
            return ArtistProfileValidationResult.Failure("Slug cannot be longer than 120 characters");
        }

        if (!MediaUrlPolicy.IsValidSlug(normalizedSlug))
        {
            return ArtistProfileValidationResult.Failure("Slug can contain only Latin letters, digits, and hyphens");
        }

        var normalizedAvatarUrl = MediaUrlPolicy.NormalizePublicUrl(avatarUrl);
        if (normalizedAvatarUrl?.Length > 500)
        {
            return ArtistProfileValidationResult.Failure("Avatar URL is too long");
        }

        if (!MediaUrlPolicy.IsSafePersistedImageUrl(normalizedAvatarUrl))
        {
            return ArtistProfileValidationResult.Failure("Invalid avatar URL");
        }

        var normalizedCoverUrl = MediaUrlPolicy.NormalizePublicUrl(coverUrl);
        if (normalizedCoverUrl?.Length > 500)
        {
            return ArtistProfileValidationResult.Failure("Cover URL is too long");
        }

        if (!MediaUrlPolicy.IsSafePersistedImageUrl(normalizedCoverUrl))
        {
            return ArtistProfileValidationResult.Failure("Invalid cover URL");
        }

        var normalizedOwnerUserId = string.IsNullOrWhiteSpace(ownerUserId)
            ? null
            : ownerUserId.Trim();

        if (validateOwnerUser && normalizedOwnerUserId?.Length > 450)
        {
            return ArtistProfileValidationResult.Failure("OwnerUserId is too long");
        }

        var excludedArtistId = currentArtistId ?? 0;

        var duplicateName = await _db.Artists.AnyAsync(
            artist => artist.Id != excludedArtistId
                && EF.Functions.Collate(artist.Name, DbText.CaseInsensitiveCollation) == normalizedName,
            cancellationToken);

        if (duplicateName)
        {
            return ArtistProfileValidationResult.Failure("An artist with this name already exists");
        }

        if (!string.IsNullOrWhiteSpace(normalizedSlug))
        {
            var duplicateSlug = await _db.Artists.AnyAsync(
                artist => artist.Id != excludedArtistId
                    && artist.Slug != null
                    && EF.Functions.Collate(artist.Slug, DbText.CaseInsensitiveCollation) == normalizedSlug,
                cancellationToken);

            if (duplicateSlug)
            {
                return ArtistProfileValidationResult.Failure("Artist slug is already in use");
            }
        }

        if (validateOwnerUser && !string.IsNullOrWhiteSpace(normalizedOwnerUserId))
        {
            var duplicateOwner = await _db.ArtistOwners.AnyAsync(
                item => item.ArtistId != excludedArtistId && item.UserId == normalizedOwnerUserId,
                cancellationToken);

            if (duplicateOwner)
            {
                return ArtistProfileValidationResult.Failure("This user is already linked to another artist");
            }

            var userExists = await _db.Users.AnyAsync(user => user.Id == normalizedOwnerUserId, cancellationToken);
            if (!userExists)
            {
                return ArtistProfileValidationResult.Failure("Linked user was not found");
            }
        }

        return ArtistProfileValidationResult.Success(
            normalizedName,
            normalizedSlug,
            normalizedAvatarUrl,
            normalizedCoverUrl,
            normalizedOwnerUserId);
    }
}
