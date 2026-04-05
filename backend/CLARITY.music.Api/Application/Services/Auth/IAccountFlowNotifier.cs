

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAccountFlowNotifier
{
    Task SendEmailConfirmationAsync(IdentityUser user, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(IdentityUser user, CancellationToken cancellationToken);
    string? GetDeliveryHint();
}
