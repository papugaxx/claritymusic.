

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Text;
using CLARITY.music.Api.Application.Options;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AccountLinkBuilder : IAccountLinkBuilder
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly string _baseUrl;
    private readonly string _frontendGoogleCallbackPath;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AccountLinkBuilder(
        IOptions<AuthFlowOptions> authFlowOptions,
        IOptions<GoogleAuthOptions> googleOptions,
        IConfiguration configuration)
    {
        
        _baseUrl = ResolveBaseUrl(authFlowOptions.Value, configuration);
        _frontendGoogleCallbackPath = NormalizeRelativePath(googleOptions.Value.FrontendCallbackPath, "/auth/google/callback");
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public string BuildEmailConfirmationUrl(string userId, string token)
    {
        var encodedToken = EncodeToken(token);
        return QueryHelpers.AddQueryString($"{_baseUrl}/confirm-email", new Dictionary<string, string?>
        {
            ["userId"] = userId,
            ["token"] = encodedToken,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public string BuildPasswordResetUrl(string email, string token)
    {
        var encodedToken = EncodeToken(token);
        return QueryHelpers.AddQueryString($"{_baseUrl}/reset-password", new Dictionary<string, string?>
        {
            ["email"] = email,
            ["token"] = encodedToken,
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public string BuildGoogleCallbackCompletionUrl(bool succeeded, string returnUrl, string? errorCode = null, string? errorMessage = null)
    {
        var query = new Dictionary<string, string?>
        {
            ["status"] = succeeded ? "success" : "error",
            ["returnUrl"] = NormalizeReturnUrl(returnUrl),
        };

        if (!string.IsNullOrWhiteSpace(errorCode))
            query["errorCode"] = errorCode;

        if (!string.IsNullOrWhiteSpace(errorMessage))
            query["errorMessage"] = errorMessage;

        return QueryHelpers.AddQueryString($"{_baseUrl}{_frontendGoogleCallbackPath}", query);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string EncodeToken(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token ?? string.Empty);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveBaseUrl(AuthFlowOptions options, IConfiguration configuration)
    {
        
        var configured = NormalizeUrl(options.PublicAppBaseUrl);
        if (!string.IsNullOrWhiteSpace(configured))
            return configured;

        var corsOrigin = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?
            .Select(NormalizeUrl)
            .FirstOrDefault(static value => !string.IsNullOrWhiteSpace(value));

        if (!string.IsNullOrWhiteSpace(corsOrigin))
            return corsOrigin;

        return "http://localhost:5173";
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string NormalizeReturnUrl(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || !trimmed.StartsWith('/'))
            return "/app";

        return trimmed;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string NormalizeRelativePath(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            return fallback;

        return trimmed.StartsWith('/') ? trimmed : $"/{trimmed}";
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string? NormalizeUrl(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            return null;

        return trimmed.TrimEnd('/');
    }
}
