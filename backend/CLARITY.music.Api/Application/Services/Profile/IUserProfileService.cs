

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Profile;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IUserProfileService
{
    Task<UserProfileDto> GetAsync(string userId, string? fallbackIdentityName, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateAsync(string userId, string? fallbackIdentityName, MeProfileUpdateRequest request, CancellationToken cancellationToken = default);
}
