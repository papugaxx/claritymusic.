

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Auth;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/auth")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class AuthController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly IAuthWorkflowService _authWorkflow;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AuthController(SignInManager<IdentityUser> signInManager, IAuthWorkflowService authWorkflow)
    {
        
        _signInManager = signInManager;
        _authWorkflow = authWorkflow;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        
        var result = await _authWorkflow.RegisterAsync(request, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authWorkflow.LoginAsync(request);
        return ToActionResult(result);
    }

    [HttpPost("logout")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new AuthOperationResponseDto
        {
            Ok = true,
        });
    }

    [HttpGet("google/start")]
    [IgnoreAntiforgeryToken]
    // Метод нижче виконує окрему частину логіки цього модуля
    public IActionResult StartGoogle([FromQuery] string? returnUrl = null)
    {
        var normalizedReturnUrl = _authWorkflow.NormalizeFrontendReturnUrl(returnUrl);
        if (!_authWorkflow.IsGoogleConfigured())
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured."));
        }

        var redirectUrl = Url.ActionLink(nameof(GoogleResponse), values: new { returnUrl = normalizedReturnUrl });
        if (string.IsNullOrWhiteSpace(redirectUrl))
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_LOGIN_FAILED", "Could not start the Google sign-in flow."));
        }

        var properties = _signInManager.ConfigureExternalAuthenticationProperties(GoogleDefaults.AuthenticationScheme, redirectUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google/response")]
    [IgnoreAntiforgeryToken]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> GoogleResponse([FromQuery] string? returnUrl = null, [FromQuery] string? remoteError = null)
    {
        var normalizedReturnUrl = _authWorkflow.NormalizeFrontendReturnUrl(returnUrl);
        if (!_authWorkflow.IsGoogleConfigured())
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured."));
        }

        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_ACCESS_DENIED", remoteError));
        }

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_LOGIN_FAILED", "Could not read the Google sign-in response."));
        }

        var email = ResolveExternalEmail(info.Principal);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_EMAIL_REQUIRED", "Google did not return an email address for this account."));
        }

        if (!IsExternalEmailVerified(info.Principal))
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_EMAIL_NOT_VERIFIED", "The Google account email address is not verified."));
        }

        var user = await _authWorkflow.FindOrCreateGoogleUserAsync(info);
        if (user is null)
        {
            return Redirect(_authWorkflow.BuildGoogleRedirect(false, normalizedReturnUrl, "GOOGLE_LOGIN_FAILED", "Could not complete Google sign-in."));
        }

        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        await _signInManager.SignInAsync(user, isPersistent: true, info.LoginProvider);

        return Redirect(_authWorkflow.BuildGoogleRedirect(true, normalizedReturnUrl));
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        var result = await _authWorkflow.ForgotPasswordAsync(request, CancellationToken.None);
        return ToActionResult(result);
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        var result = await _authWorkflow.ResetPasswordAsync(request);
        return ToActionResult(result);
    }

    [HttpPost("confirm-email")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequestDto request)
    {
        var result = await _authWorkflow.ConfirmEmailAsync(request);
        return ToActionResult(result);
    }

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequestDto request)
    {
        var result = await _authWorkflow.ResendConfirmationAsync(request, CancellationToken.None);
        return ToActionResult(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    [EnableRateLimiting("auth")]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        var result = await _authWorkflow.ChangePasswordAsync(User, request);
        return ToActionResult(result);
    }

    [HttpGet("me")]
    [IgnoreAntiforgeryToken]
    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<IActionResult> Me()
    {
        return Ok(await _authWorkflow.GetCurrentUserAsync(User));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
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
}
