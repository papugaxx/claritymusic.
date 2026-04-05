

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace CLARITY.music.Api.Infrastructure.Realtime;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class SignalRRealtimeNotifier : IRealtimeNotifier
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IHubContext<OperationsHub> _hubContext;
    private readonly ILogger<SignalRRealtimeNotifier> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public SignalRRealtimeNotifier(
        IHubContext<OperationsHub> hubContext,
        ILogger<SignalRRealtimeNotifier> logger)
    {
        
        _hubContext = hubContext;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task NotifyLookupChangedAsync(string entityType, string action, int? entityId, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var operation = new RealtimeOperationEvent(
            Channel: "lookups",
            EntityType: entityType,
            Action: action,
            EntityId: entityId,
            ArtistId: null,
            IsActive: null,
            ActorEmail: NormalizeActorEmail(actorEmail),
            OccurredAtUtc: DateTime.UtcNow);

        return SafePublishAsync(
            new[]
            {
                _hubContext.Clients.Group(OperationsHubGroups.Admins)
            },
            operation,
            cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task NotifyArtistChangedAsync(int artistId, string action, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var operation = new RealtimeOperationEvent(
            Channel: "artist-profile",
            EntityType: "artist",
            Action: action,
            EntityId: artistId,
            ArtistId: artistId,
            IsActive: null,
            ActorEmail: NormalizeActorEmail(actorEmail),
            OccurredAtUtc: DateTime.UtcNow);

        return SafePublishAsync(
            new[]
            {
                _hubContext.Clients.Group(OperationsHubGroups.Admins),
                _hubContext.Clients.Group(OperationsHubGroups.ForArtist(artistId))
            },
            operation,
            cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task NotifyTrackChangedAsync(int trackId, int artistId, string action, bool isActive, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var operation = new RealtimeOperationEvent(
            Channel: "tracks",
            EntityType: "track",
            Action: action,
            EntityId: trackId,
            ArtistId: artistId,
            IsActive: isActive,
            ActorEmail: NormalizeActorEmail(actorEmail),
            OccurredAtUtc: DateTime.UtcNow);

        return SafePublishAsync(
            new[]
            {
                _hubContext.Clients.Group(OperationsHubGroups.Admins),
                _hubContext.Clients.Group(OperationsHubGroups.ForArtist(artistId))
            },
            operation,
            cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task SafePublishAsync(IEnumerable<IClientProxy> targets, RealtimeOperationEvent operation, CancellationToken cancellationToken)
    {
        try
        {
            await Task.WhenAll(targets.Select(target => target.SendAsync(OperationsHub.ClientEventName, operation, cancellationToken)));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Realtime notification publish failed. Channel={Channel}, EntityType={EntityType}, Action={Action}, EntityId={EntityId}, ArtistId={ArtistId}",
                operation.Channel,
                operation.EntityType,
                operation.Action,
                operation.EntityId,
                operation.ArtistId);
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string NormalizeActorEmail(string? actorEmail)
    {
        return string.IsNullOrWhiteSpace(actorEmail)
            ? "system"
            : actorEmail.Trim();
    }
}
