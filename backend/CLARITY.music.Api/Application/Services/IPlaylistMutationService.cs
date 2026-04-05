

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Http;
using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IPlaylistMutationService
{
    Task<Playlist?> GetOwnedAsync(int playlistId, string userId, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<ServiceResult> CreateAsync(string userId, string? userEmail, CreatePlaylistRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateAsync(int playlistId, string userId, UpdatePlaylistRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteAsync(int playlistId, string userId, string? userEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> HasTrackAsync(int playlistId, int trackId, string userId, CancellationToken cancellationToken = default);
    Task<ServiceResult> AddTrackAsync(int playlistId, int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> RemoveTrackAsync(int playlistId, int trackId, string userId, string? userEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> UploadCoverAsync(int playlistId, string userId, IFormFile? file, string? userEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> RemoveCoverAsync(int playlistId, string userId, string? userEmail, CancellationToken cancellationToken = default);
}
