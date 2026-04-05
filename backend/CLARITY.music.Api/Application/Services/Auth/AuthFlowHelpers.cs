

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace CLARITY.music.Api.Application.Services.Auth;




internal static class AuthFlowHelpers
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static string NormalizeArtistName(string? displayName, string email)
    {
        var candidate = string.IsNullOrWhiteSpace(displayName)
            ? email.Split('@')[0]
            : displayName.Trim();

        if (candidate.Length < 2)
        {
            candidate = email.Split('@')[0].Trim();
        }

        if (candidate.Length > 100)
        {
            candidate = candidate[..100].Trim();
        }

        return candidate;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static string? DecodeToken(string encodedToken)
    {
        try
        {
            var bytes = WebEncoders.Base64UrlDecode(encodedToken);
            return Encoding.UTF8.GetString(bytes);
        }
        catch (FormatException)
        {
            return null;
        }
    }

    // Метод нижче перетворює модель у формат потрібний іншому шару
    public static string MapIdentityErrors(IEnumerable<IdentityError> errors, string fallback)
    {
        var messages = errors
            .Select(error => MapIdentityError(error))
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return messages.Count > 0
            ? string.Join(" ", messages)
            : fallback;
    }

    // Метод нижче перетворює модель у формат потрібний іншому шару
    private static string MapIdentityError(IdentityError error)
    {
        if (error.Code.Contains("DuplicateEmail", StringComparison.OrdinalIgnoreCase))
        {
            return "A user with this email already exists";
        }

        if (error.Code.Contains("DuplicateUserName", StringComparison.OrdinalIgnoreCase))
        {
            return "A user with this email already exists";
        }

        return error.Description;
    }
}
