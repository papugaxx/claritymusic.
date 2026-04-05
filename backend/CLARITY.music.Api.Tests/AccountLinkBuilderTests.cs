

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Options;
using CLARITY.music.Api.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Tests;

// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AccountLinkBuilderTests
{
    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void BuildGoogleCallbackCompletionUrl_UsesConfiguredBaseUrlAndNormalizesReturnUrl()
    {
        var configuration = new ConfigurationBuilder().Build();
        var builder = new AccountLinkBuilder(
            Options.Create(new AuthFlowOptions { PublicAppBaseUrl = "https://clarity.example.com/" }),
            Options.Create(new GoogleAuthOptions { FrontendCallbackPath = "auth/google/callback" }),
            configuration);

        var result = builder.BuildGoogleCallbackCompletionUrl(
            succeeded: false,
            returnUrl: "https://malicious.example.com",
            errorCode: "google_access_denied");

        Assert.StartsWith("https://clarity.example.com/auth/google/callback?", result, StringComparison.Ordinal);
        Assert.Contains("status=error", result, StringComparison.Ordinal);
        Assert.Contains("returnUrl=%2Fapp", result, StringComparison.Ordinal);
        Assert.Contains("errorCode=google_access_denied", result, StringComparison.Ordinal);
    }

    [Fact]
    // Метод нижче виконує окрему частину логіки цього модуля
    public void BuildPasswordResetUrl_FallsBackToCorsOrigin_WhenPublicBaseUrlIsMissing()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "https://frontend.example.com/"
            })
            .Build();

        var builder = new AccountLinkBuilder(
            Options.Create(new AuthFlowOptions()),
            Options.Create(new GoogleAuthOptions()),
            configuration);

        var result = builder.BuildPasswordResetUrl("user@example.com", "reset-token");

        Assert.StartsWith("https://frontend.example.com/reset-password?", result, StringComparison.Ordinal);
        Assert.DoesNotContain("http://localhost:5173", result, StringComparison.Ordinal);
        Assert.Contains("token=", result, StringComparison.Ordinal);
    }
}
