

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAccountRegistrationService
{
    Task<ServiceResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
}
