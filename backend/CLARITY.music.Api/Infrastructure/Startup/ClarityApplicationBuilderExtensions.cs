

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;

namespace CLARITY.music.Api.Infrastructure.Startup;




public static class ClarityApplicationBuilderExtensions
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static WebApplication UseClarityApi(this WebApplication app, IConfiguration configuration)
    {
        if (configuration.GetValue<bool>("ForwardedHeaders:Enabled"))
        {
            var forwardLimit = Math.Max(1, configuration.GetValue<int?>("ForwardedHeaders:ForwardLimit") ?? 1);
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
                ForwardLimit = forwardLimit,
            });
        }

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var feature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = feature?.Error;
                var logger = context.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GlobalExceptionHandler");

                if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested)
                {
                    logger.LogInformation("Request was canceled by the client. TraceId={TraceId}", context.TraceIdentifier);
                    if (!context.Response.HasStarted)
                    {
                        context.Response.StatusCode = 499;
                    }

                    return;
                }

                if (exception is not null)
                {
                    logger.LogError(exception, "Unhandled exception. TraceId={TraceId}", context.TraceIdentifier);
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Internal server error",
                    traceId = context.TraceIdentifier,
                });
            });
        });

        app.UseCors("Frontend");
        app.UseStaticFiles();
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseClarityAntiforgery();
        app.UseAuthorization();

        app.MapControllers();
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
        app.MapGet("/api/csrf/token", (HttpContext httpContext, IAntiforgery antiforgery) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(httpContext);
            return Results.Ok(new { csrfToken = tokens.RequestToken });
        });
        app.MapFallbackToFile("index.html");

        return app;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static IApplicationBuilder UseClarityAntiforgery(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            if (IsSafeMethod(context.Request.Method) || IsCsrfExempt(context.Request.Path) || !context.Request.Path.StartsWithSegments("/api"))
            {
                await next();
                return;
            }

            try
            {
                var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
                await antiforgery.ValidateRequestAsync(context);
                await next();
            }
            catch (AntiforgeryValidationException)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(ApiErrorResponse.Create("CSRF token validation failed"));
            }
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool IsSafeMethod(string method)
    {
        return HttpMethods.IsGet(method)
            || HttpMethods.IsHead(method)
            || HttpMethods.IsOptions(method)
            || HttpMethods.IsTrace(method);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool IsCsrfExempt(PathString path)
    {
        return path.StartsWithSegments("/api/health")
            || path.StartsWithSegments("/api/csrf/token");
    }
}
