

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.Application.Options;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AuthWorkflowService : IAuthWorkflowService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IAccountLinkBuilder _accountLinkBuilder;
    private readonly IAccountRegistrationService _registrationService;
    private readonly IAccountRecoveryService _recoveryService;
    private readonly IAuthSessionService _sessionService;
    private readonly GoogleAuthOptions _googleOptions;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AuthWorkflowService(
        IAccountLinkBuilder accountLinkBuilder,
        IAccountRegistrationService registrationService,
        IAccountRecoveryService recoveryService,
        IAuthSessionService sessionService,
        IOptions<GoogleAuthOptions> googleOptions)
    {
        
        _accountLinkBuilder = accountLinkBuilder;
        _registrationService = registrationService;
        _recoveryService = recoveryService;
        _sessionService = sessionService;
        _googleOptions = googleOptions.Value;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public bool IsGoogleConfigured() => _googleOptions.IsConfigured();

    // Метод нижче виконує окрему частину логіки цього модуля
    public string NormalizeFrontendReturnUrl(string? returnUrl)
    {
        var trimmed = returnUrl?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || !trimmed.StartsWith('/'))
        {
            return "/app";
        }

        return trimmed;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public string BuildGoogleRedirect(bool succeeded, string returnUrl, string? errorCode = null, string? errorMessage = null)
    {
        return _accountLinkBuilder.BuildGoogleCallbackCompletionUrl(succeeded, returnUrl, errorCode, errorMessage);
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public Task<ServiceResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        
        return _registrationService.RegisterAsync(request, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> LoginAsync(LoginRequestDto request)
    {
        return _sessionService.LoginAsync(request);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken)
    {
        return _recoveryService.ForgotPasswordAsync(request, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        return _recoveryService.ResetPasswordAsync(request);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> ConfirmEmailAsync(ConfirmEmailRequestDto request)
    {
        return _recoveryService.ConfirmEmailAsync(request);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> ResendConfirmationAsync(ResendConfirmationRequestDto request, CancellationToken cancellationToken)
    {
        return _recoveryService.ResendConfirmationAsync(request, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequestDto request)
    {
        return _sessionService.ChangePasswordAsync(principal, request);
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public Task<AuthMeResponseDto> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        return _sessionService.GetCurrentUserAsync(principal);
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public Task<IdentityUser?> FindOrCreateGoogleUserAsync(ExternalLoginInfo info)
    {
        return _sessionService.FindOrCreateGoogleUserAsync(info);
    }
}
