

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Security.Claims;
using CLARITY.music.Api.Application.Services;
using Microsoft.AspNetCore.Http;
using Moq;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class CurrentUserServiceTests
{
    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void TryGetUserId_ReturnsFalse_WhenUserIsNotAuthenticated()
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var artistOwnership = new Mock<IArtistOwnershipService>(MockBehavior.Strict);
        var service = new CurrentUserService(accessor, artistOwnership.Object);

        var result = service.TryGetUserId(out var userId);

        Assert.False(result);
        Assert.Equal(string.Empty, userId);
    }

    [Fact]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task GetOwnedArtistIdAsync_UsesClaimWithoutCallingOwnershipService()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "user-1"),
            new Claim(AppClaimTypes.ArtistId, "42")
        ], authenticationType: "Tests"));

        var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext { User = principal } };
        var artistOwnership = new Mock<IArtistOwnershipService>(MockBehavior.Strict);
        var service = new CurrentUserService(accessor, artistOwnership.Object);

        var artistId = await service.GetOwnedArtistIdAsync();

        Assert.Equal(42, artistId);
        artistOwnership.Verify(item => item.GetOwnedArtistIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task GetOwnedArtistIdAsync_FallsBackToOwnershipService_WhenClaimIsMissing()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "user-2")
        ], authenticationType: "Tests"));

        var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext { User = principal } };
        var artistOwnership = new Mock<IArtistOwnershipService>();
        artistOwnership
            .Setup(item => item.GetOwnedArtistIdAsync("user-2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);

        var service = new CurrentUserService(accessor, artistOwnership.Object);

        var artistId = await service.GetOwnedArtistIdAsync();

        Assert.Equal(7, artistId);
        artistOwnership.Verify(item => item.GetOwnedArtistIdAsync("user-2", It.IsAny<CancellationToken>()), Times.Once);
    }
}
