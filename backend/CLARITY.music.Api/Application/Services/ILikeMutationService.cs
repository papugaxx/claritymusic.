

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ILikeMutationService
{
    Task<ServiceResult> ToggleAsync(int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> AddAsync(int trackId, string userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> RemoveAsync(int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default);
}
