

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Infrastructure.Realtime;




// Record нижче задає компактну форму даних для передачі між шарами
public sealed record RealtimeOperationEvent(
    string Channel,
    string EntityType,
    string Action,
    int? EntityId,
    int? ArtistId,
    bool? IsActive,
    string? ActorEmail,
    DateTime OccurredAtUtc);
