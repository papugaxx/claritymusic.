

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAuthWorkflowService
{
    bool IsGoogleConfigured();
    string NormalizeFrontendReturnUrl(string? returnUrl);
    string BuildGoogleRedirect(bool succeeded, string returnUrl, string? errorCode = null, string? errorMessage = null);
    Task<ServiceResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken);
    Task<ServiceResult> LoginAsync(LoginRequestDto request);
    Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken);
    Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequestDto request);
    Task<ServiceResult> ConfirmEmailAsync(ConfirmEmailRequestDto request);
    Task<ServiceResult> ResendConfirmationAsync(ResendConfirmationRequestDto request, CancellationToken cancellationToken);
    Task<ServiceResult> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequestDto request);
    Task<AuthMeResponseDto> GetCurrentUserAsync(ClaimsPrincipal principal);
    Task<IdentityUser?> FindOrCreateGoogleUserAsync(ExternalLoginInfo info);
}
