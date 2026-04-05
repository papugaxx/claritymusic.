

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ITrackMutationResultFactory
{
    Task<TrackMutationResultDto> BuildAsync(int trackId, bool updated = false, CancellationToken cancellationToken = default);
}
