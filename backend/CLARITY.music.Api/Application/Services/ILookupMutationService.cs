

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ILookupMutationService
{
    Task<ServiceResult> CreateGenreAsync(NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateGenreAsync(int id, NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteGenreAsync(int id, CancellationToken cancellationToken = default);
    Task<ServiceResult> CreateMoodAsync(NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateMoodAsync(int id, NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteMoodAsync(int id, CancellationToken cancellationToken = default);
}
