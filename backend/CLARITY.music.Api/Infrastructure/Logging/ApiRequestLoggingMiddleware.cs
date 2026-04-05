

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Diagnostics;
using System.Security.Claims;
using CLARITY.music.Api.Application.Options;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Infrastructure.Logging;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ApiRequestLoggingMiddleware
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private const string CorrelationIdHeaderName = "X-Correlation-ID";

    private readonly RequestDelegate _next;
    private readonly ILogger<ApiRequestLoggingMiddleware> _logger;
    private readonly ObservabilityOptions _options;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ApiRequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<ApiRequestLoggingMiddleware> logger,
        IOptions<ObservabilityOptions> options)
    {
        
        _next = next;
        _logger = logger;
        _options = options.Value;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task InvokeAsync(HttpContext context)
    {
        EnsureCorrelationIdHeader(context);

        if (!_options.EnableApiRequestLogging || !ShouldLog(context.Request))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;
        var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty;
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        var userEmail = context.User.Identity?.Name ?? "anonymous";

        using (_logger.BeginScope(new Dictionary<string, object?>
        {
            ["TraceId"] = context.TraceIdentifier,
            ["CorrelationId"] = context.Response.Headers[CorrelationIdHeaderName].ToString(),
            ["UserId"] = userId,
            ["UserEmail"] = userEmail,
        }))
        {
            await _next(context);
            stopwatch.Stop();

            LogCompletedRequest(context, method, path, queryString, userId, userEmail, stopwatch.Elapsed.TotalMilliseconds);
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private void LogCompletedRequest(
        HttpContext context,
        string method,
        string path,
        string? queryString,
        string userId,
        string userEmail,
        double elapsedMs)
    {
        var statusCode = context.Response.StatusCode;
        var message = "API request completed. {Method} {Path}{QueryString} responded {StatusCode} in {ElapsedMs} ms. UserId={UserId}, UserEmail={UserEmail}";

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(message, method, path, queryString ?? string.Empty, statusCode, Math.Round(elapsedMs, 2), userId, userEmail);
            return;
        }

        if (statusCode >= StatusCodes.Status400BadRequest || elapsedMs >= NormalizeSlowRequestThreshold(_options.SlowRequestWarningMs))
        {
            _logger.LogWarning(message, method, path, queryString ?? string.Empty, statusCode, Math.Round(elapsedMs, 2), userId, userEmail);
            return;
        }

        _logger.LogInformation(message, method, path, queryString ?? string.Empty, statusCode, Math.Round(elapsedMs, 2), userId, userEmail);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool ShouldLog(HttpRequest request)
    {
        if (!request.Path.StartsWithSegments("/api"))
        {
            return false;
        }

        return !request.Path.StartsWithSegments("/api/health")
            && !request.Path.StartsWithSegments("/api/csrf/token");
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void EnsureCorrelationIdHeader(HttpContext context)
    {
        var incoming = context.Request.Headers[CorrelationIdHeaderName].ToString();
        var correlationId = string.IsNullOrWhiteSpace(incoming)
            ? context.TraceIdentifier
            : incoming.Trim();

        context.Response.Headers[CorrelationIdHeaderName] = correlationId;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static int NormalizeSlowRequestThreshold(int configuredMs)
    {
        return configuredMs > 0 ? configuredMs : 1500;
    }
}




public static class ApiRequestLoggingApplicationBuilderExtensions
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static IApplicationBuilder UseApiRequestLogging(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ApiRequestLoggingMiddleware>();
    }
}
