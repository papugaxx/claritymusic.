

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Playback;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ITrackPlayService
{
    Task<ServiceResult> RecordPlayAsync(int trackId, string userId, string? actorEmail, CancellationToken cancellationToken = default);
}
