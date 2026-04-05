

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class GoogleAccountService : IGoogleAccountService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<GoogleAccountService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public GoogleAccountService(
        UserManager<IdentityUser> userManager,
        ApplicationDbContext db,
        ILogger<GoogleAccountService> logger)
    {
        
        _userManager = userManager;
        _db = db;
        _logger = logger;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IdentityUser?> FindOrCreateAsync(ExternalLoginInfo info)
    {
        var email = NormalizeEmail(ResolveExternalEmail(info.Principal));
        if (string.IsNullOrWhiteSpace(email) || !IsExternalEmailVerified(info.Principal))
        {
            return null;
        }

        var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        if (user is not null)
        {
            return user;
        }

        user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = await CreateGoogleUserAsync(email, ResolveExternalDisplayName(info.Principal, email));
            if (user is null)
            {
                return null;
            }
        }
        else if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                _logger.LogWarning(
                    "Failed to update the local Google account for {Email}: {Error}",
                    email,
                    MapIdentityErrors(updateResult.Errors, "Unknown identity error."));
                return null;
            }
        }

        var addLoginResult = await _userManager.AddLoginAsync(user, info);
        if (!addLoginResult.Succeeded)
        {
            var alreadyLinked = await UserAlreadyHasLoginAsync(user, info.LoginProvider, info.ProviderKey);
            if (!alreadyLinked)
            {
                _logger.LogWarning(
                    "Failed to link the Google account for {Email}: {Error}",
                    email,
                    MapIdentityErrors(addLoginResult.Errors, "Unknown identity error."));
                return null;
            }
        }

        return user;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    private async Task<IdentityUser?> CreateGoogleUserAsync(string email, string displayName)
    {
        IdentityUser? createdUser = null;
        await using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            createdUser = new IdentityUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                LockoutEnabled = true,
            };

            var createResult = await _userManager.CreateAsync(createdUser);
            if (!createResult.Succeeded)
            {
                _logger.LogWarning(
                    "Failed to create a Google-backed account for {Email}: {Error}",
                    email,
                    MapIdentityErrors(createResult.Errors, "Unknown identity error."));
                await transaction.RollbackAsync();
                return null;
            }

            var roleResult = await _userManager.AddToRoleAsync(createdUser, "User");
            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException(MapIdentityErrors(roleResult.Errors, "Could not assign the default role."));
            }

            _db.UserProfiles.Add(new UserProfile
            {
                UserId = createdUser.Id,
                DisplayName = displayName,
                UpdatedAt = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return createdUser;
        }
        catch
        {
            await transaction.RollbackAsync();
            if (createdUser is not null)
            {
                await _userManager.DeleteAsync(createdUser);
            }

            throw;
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task<bool> UserAlreadyHasLoginAsync(IdentityUser user, string loginProvider, string providerKey)
    {
        var logins = await _userManager.GetLoginsAsync(user);
        return logins.Any(login =>
            string.Equals(login.LoginProvider, loginProvider, StringComparison.Ordinal)
            && string.Equals(login.ProviderKey, providerKey, StringComparison.Ordinal));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool IsExternalEmailVerified(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirst("email_verified")?.Value
            ?? principal.FindFirst("verified_email")?.Value;

        return !bool.TryParse(raw, out var verified) || verified;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveExternalEmail(ClaimsPrincipal principal)
    {
        
        return principal.FindFirstValue(ClaimTypes.Email)
            ?? principal.FindFirstValue("email")
            ?? string.Empty;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveExternalDisplayName(ClaimsPrincipal principal, string email)
    {
        
        var displayName = principal.FindFirstValue(ClaimTypes.Name)
            ?? principal.FindFirstValue("name")
            ?? principal.FindFirstValue(ClaimTypes.GivenName)
            ?? principal.FindFirstValue("given_name")
            ?? email.Split('@')[0];

        displayName = displayName.Trim();
        if (displayName.Length < 2)
        {
            displayName = email.Split('@')[0].Trim();
        }

        if (displayName.Length > 100)
        {
            displayName = displayName[..100];
        }

        return displayName;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    // Метод нижче перетворює модель у формат потрібний іншому шару
    private static string MapIdentityErrors(IEnumerable<IdentityError> errors, string fallback)
    {
        var messages = errors
            .Select(error => error.Description)
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return messages.Count > 0
            ? string.Join(" ", messages)
            : fallback;
    }
}
