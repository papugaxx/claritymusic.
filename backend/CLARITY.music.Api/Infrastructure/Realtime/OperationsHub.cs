

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CLARITY.music.Api.Infrastructure.Realtime;




[Authorize]
// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class OperationsHub : Hub
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string ClientEventName = "operations.changed";

    // Метод нижче виконує окрему частину логіки цього модуля
    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            if (user.IsInRole("Admin"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, OperationsHubGroups.Admins);
            }

            var artistIdClaim = user.FindFirstValue(AppClaimTypes.ArtistId);
            if (int.TryParse(artistIdClaim, out var artistId) && artistId > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, OperationsHubGroups.ForArtist(artistId));
            }
        }

        await base.OnConnectedAsync();
    }
}
