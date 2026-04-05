

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAuthSessionService
{
    Task<ServiceResult> LoginAsync(LoginRequestDto request);
    Task<ServiceResult> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequestDto request);
    Task<AuthMeResponseDto> GetCurrentUserAsync(ClaimsPrincipal principal);
    Task<IdentityUser?> FindOrCreateGoogleUserAsync(ExternalLoginInfo info);
}
