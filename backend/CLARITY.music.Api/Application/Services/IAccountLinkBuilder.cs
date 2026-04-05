

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAccountLinkBuilder
{
    string BuildEmailConfirmationUrl(string userId, string token);
    string BuildPasswordResetUrl(string email, string token);
    string BuildGoogleCallbackCompletionUrl(bool succeeded, string returnUrl, string? errorCode = null, string? errorMessage = null);
}
