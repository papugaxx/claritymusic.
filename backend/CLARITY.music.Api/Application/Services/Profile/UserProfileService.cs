

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Queries;
using CLARITY.music.Api.Infrastructure.Commands;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Profile;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class UserProfileService : IUserProfileService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    // Коментар коротко пояснює призначення наступного фрагмента
    public UserProfileService(ApplicationDbContext db, IWebHostEnvironment env)
    {
        
        _db = db;
        _env = env;
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<UserProfileDto> GetAsync(string userId, string? fallbackIdentityName, CancellationToken cancellationToken = default)
    {
        var queryCancellationToken = ReadQueryCancellation.Normalize(cancellationToken);
        var profile = await _db.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId, queryCancellationToken);

        var fallbackName = ResolveFallbackName(fallbackIdentityName);

        return new UserProfileDto
        {
            UserId = userId,
            DisplayName = string.IsNullOrWhiteSpace(profile?.DisplayName) ? fallbackName : profile.DisplayName,
            AvatarUrl = profile?.AvatarUrl,
            UpdatedAt = profile?.UpdatedAt,
        };
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateAsync(string userId, string? fallbackIdentityName, MeProfileUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(item => item.UserId == userId, writeCancellationToken);
        if (profile is null)
        {
            profile = new UserProfile
            {
                UserId = userId,
            };

            _db.UserProfiles.Add(profile);
        }

        var displayName = (request.DisplayName ?? string.Empty).Trim();
        if (displayName.Length == 0)
        {
            displayName = ResolveFallbackName(fallbackIdentityName);
        }

        if (displayName.Length > 80)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Profile name cannot be longer than 80 characters"));
        }

        var avatarUrl = MediaUrlPolicy.NormalizePublicUrl(request.AvatarUrl);
        if (avatarUrl?.Length > 500)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Avatar URL is too long"));
        }

        if (!MediaUrlPolicy.IsSafePersistedImageUrl(avatarUrl))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Invalid avatar URL"));
        }

        var oldAvatarUrl = profile.AvatarUrl;
        profile.DisplayName = displayName;
        profile.AvatarUrl = avatarUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(writeCancellationToken);

        if (!string.Equals(oldAvatarUrl, avatarUrl, StringComparison.OrdinalIgnoreCase))
        {
            await ManagedUploadFiles.DeleteIfUnreferencedAsync(_env, _db, oldAvatarUrl, writeCancellationToken);
        }

        return ServiceResult.Ok(new UserProfileDto
        {
            UserId = profile.UserId,
            DisplayName = profile.DisplayName,
            AvatarUrl = profile.AvatarUrl,
            UpdatedAt = profile.UpdatedAt,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveFallbackName(string? identityName)
    {
        
        var source = string.IsNullOrWhiteSpace(identityName) ? "user" : identityName;
        return source.Split('@')[0];
    }
}
