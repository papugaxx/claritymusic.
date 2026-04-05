

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IManagedUploadService
{
    Task<ServiceResult> UploadAvatarAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> UploadCoverAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> UploadAudioAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteAsync(string? url, string userId, bool isAdmin, CancellationToken cancellationToken = default);
}
