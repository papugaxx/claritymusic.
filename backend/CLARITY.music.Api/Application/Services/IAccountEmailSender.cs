

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAccountEmailSender
{
    Task SendEmailConfirmationAsync(string email, string confirmationUrl, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string email, string resetUrl, CancellationToken cancellationToken = default);
}
