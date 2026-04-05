

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ITrackMutationService
{
    Task<ServiceResult> CreateAdminAsync(AdminTrackSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateAdminAsync(int trackId, AdminTrackSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> SetAdminStatusAsync(int trackId, bool isActive, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteAdminAsync(int trackId, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> CreateArtistAsync(int artistId, ArtistTrackSaveRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateArtistAsync(int trackId, int artistId, ArtistTrackSaveRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> SetArtistStatusAsync(int trackId, int artistId, bool isActive, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteArtistAsync(int trackId, int artistId, CancellationToken cancellationToken = default);
}
