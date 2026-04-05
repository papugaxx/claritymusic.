

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AuthSessionService : IAuthSessionService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly ApplicationDbContext _db;
    private readonly IArtistOwnershipService _artistOwnership;
    private readonly IAccountFlowNotifier _accountFlowNotifier;
    private readonly IGoogleAccountService _googleAccountService;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AuthSessionService(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        ApplicationDbContext db,
        IArtistOwnershipService artistOwnership,
        IAccountFlowNotifier accountFlowNotifier,
        IGoogleAccountService googleAccountService)
    {
        
        _userManager = userManager;
        _signInManager = signInManager;
        _db = db;
        _artistOwnership = artistOwnership;
        _accountFlowNotifier = accountFlowNotifier;
        _googleAccountService = googleAccountService;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> LoginAsync(LoginRequestDto request)
    {
        var email = AuthFlowHelpers.NormalizeEmail(request.Email);
        var password = request.Password ?? string.Empty;

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return ServiceResult.Unauthorized(ApiErrorResponse.Create("Invalid email or password"));
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return ServiceResult.Locked(ApiErrorResponse.Create("The account is temporarily locked because of too many failed sign-in attempts"));
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
        if (!isPasswordValid)
        {
            await _userManager.AccessFailedAsync(user);
            if (await _userManager.IsLockedOutAsync(user))
            {
                return ServiceResult.Locked(ApiErrorResponse.Create("The account is temporarily locked because of too many failed sign-in attempts"));
            }

            return ServiceResult.Unauthorized(ApiErrorResponse.Create("Invalid email or password"));
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            return ServiceResult.Forbidden(new AuthErrorResponseDto
            {
                Error = "Confirm your email address before signing in",
                RequiresEmailConfirmation = true,
                Email = user.Email,
                DeliveryHint = _accountFlowNotifier.GetDeliveryHint(),
            });
        }

        await _userManager.ResetAccessFailedCountAsync(user);
        await _signInManager.SignInAsync(user, isPersistent: true);

        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequestDto request)
    {
        var currentPassword = request.CurrentPassword ?? string.Empty;
        var newPassword = request.NewPassword ?? string.Empty;
        var confirmPassword = request.ConfirmNewPassword ?? string.Empty;

        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Current password and new password are required"));
        }

        if (!string.Equals(newPassword, confirmPassword, StringComparison.Ordinal))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The new password and confirmation password do not match"));
        }

        var user = await _userManager.GetUserAsync(principal);
        if (user is null)
        {
            return ServiceResult.Unauthorized(ApiErrorResponse.Create("Authentication required"));
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(AuthFlowHelpers.MapIdentityErrors(result.Errors, "Could not change the password.")));
        }

        await _signInManager.RefreshSignInAsync(user);
        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            Message = "Password updated successfully",
        });
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<AuthMeResponseDto> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return new AuthMeResponseDto
            {
                IsAuthenticated = false,
            };
        }

        var user = await _userManager.GetUserAsync(principal);
        if (user is null)
        {
            return new AuthMeResponseDto
            {
                IsAuthenticated = false,
            };
        }

        var roles = await _userManager.GetRolesAsync(user);
        var profile = await _db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(item => item.UserId == user.Id);

        int? artistId = null;
        var artistIdClaim = principal.FindFirstValue(AppClaimTypes.ArtistId);
        if (int.TryParse(artistIdClaim, out var parsedArtistId) && parsedArtistId > 0)
        {
            artistId = parsedArtistId;
        }
        else
        {
            artistId = await _artistOwnership.GetOwnedArtistIdAsync(user.Id);
        }

        var fallbackName = (user.Email ?? user.UserName ?? "user").Split('@')[0];
        var displayName = string.IsNullOrWhiteSpace(profile?.DisplayName) ? fallbackName : profile!.DisplayName;
        var avatarUrl = string.IsNullOrWhiteSpace(profile?.AvatarUrl) ? null : profile.AvatarUrl;

        return new AuthMeResponseDto
        {
            IsAuthenticated = true,
            Id = user.Id,
            UserId = user.Id,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            Username = user.UserName,
            Name = displayName,
            DisplayName = displayName,
            AvatarUrl = avatarUrl,
            IsAdmin = roles.Contains("Admin"),
            IsArtist = roles.Contains("Artist"),
            ArtistId = artistId,
            Roles = roles.ToArray(),
        };
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public Task<IdentityUser?> FindOrCreateGoogleUserAsync(ExternalLoginInfo info)
    {
        return _googleAccountService.FindOrCreateAsync(info);
    }
}
