

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services.Realtime;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IRealtimeNotifier
{
    Task NotifyLookupChangedAsync(string entityType, string action, int? entityId, string? actorEmail, CancellationToken cancellationToken = default);
    Task NotifyArtistChangedAsync(int artistId, string action, string? actorEmail, CancellationToken cancellationToken = default);
    Task NotifyTrackChangedAsync(int trackId, int artistId, string action, bool isActive, string? actorEmail, CancellationToken cancellationToken = default);
}
