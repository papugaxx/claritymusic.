

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAccountRecoveryService
{
    Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequestDto request);
    Task<ServiceResult> ConfirmEmailAsync(ConfirmEmailRequestDto request);
    Task<ServiceResult> ResendConfirmationAsync(ResendConfirmationRequestDto request, CancellationToken cancellationToken = default);
}
