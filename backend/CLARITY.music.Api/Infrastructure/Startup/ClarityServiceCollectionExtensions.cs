

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Threading.RateLimiting;
using CLARITY.music.Api.Application.Options;
using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Auth;
using CLARITY.music.Api.Application.Services.Playback;
using CLARITY.music.Api.Application.Services.Profile;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.Application.Services.Validation;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Email;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Infrastructure.Startup;




public static class ClarityServiceCollectionExtensions
{
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public static IServiceCollection AddClarityApi(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var secureCookiePolicy = environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

        services.AddControllers();
        ConfigureApiBehavior(services);
        services.AddHttpContextAccessor();
        ConfigureAntiforgery(services, secureCookiePolicy);
        ConfigureOptions(services, configuration);
        RegisterApplicationServices(services);
        RegisterInfrastructureServices(services);
        ConfigureDatabase(services, configuration, environment);
        ConfigureIdentity(services);
        ConfigureExternalAuth(services, configuration);
        ConfigureApplicationCookie(services, secureCookiePolicy);
        ConfigureAuthorization(services);
        ConfigureRateLimiting(services);
        ConfigureMediaPolicy(configuration, environment);
        ConfigureCors(services, configuration);

        return services;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureApiBehavior(IServiceCollection services)
    {
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var firstError = context.ModelState
                    .SelectMany(entry => entry.Value?.Errors ?? Enumerable.Empty<Microsoft.AspNetCore.Mvc.ModelBinding.ModelError>())
                    .Select(error => error.ErrorMessage)
                    .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message));

                return new BadRequestObjectResult(ApiErrorResponse.Create(firstError ?? "Request validation failed"));
            };
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureAntiforgery(IServiceCollection services, CookieSecurePolicy secureCookiePolicy)
    {
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.Cookie.Name = "clarity_xsrf";
            options.Cookie.HttpOnly = false;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = secureCookiePolicy;
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureOptions(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthFlowOptions>(configuration.GetSection(AuthFlowOptions.SectionName));
        services.Configure<EmailDeliveryOptions>(configuration.GetSection(EmailDeliveryOptions.SectionName));
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    private static void RegisterApplicationServices(IServiceCollection services)
    {
        
        services.AddScoped<IArtistOwnershipService, ArtistOwnershipService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITrackMutationResultFactory, TrackMutationResultFactory>();
        services.AddScoped<IArtistProfileValidationService, ArtistProfileValidationService>();
        services.AddScoped<IArtistMutationService, ArtistMutationService>();
        services.AddScoped<IPlaylistMutationService, PlaylistMutationService>();
        services.AddScoped<ILikeMutationService, LikeMutationService>();
        services.AddScoped<IArtistFollowService, ArtistFollowService>();
        services.AddScoped<ITrackMutationService, TrackMutationService>();
        services.AddScoped<ITrackPlayService, TrackPlayService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<ILookupMutationService, LookupMutationService>();
        services.AddScoped<IManagedUploadService, ManagedUploadService>();

        services.AddScoped<ITrackQueryService, TrackQueryService>();
        services.AddScoped<IArtistQueryService, ArtistQueryService>();
        services.AddScoped<IPlaylistQueryService, PlaylistQueryService>();
        services.AddScoped<ILikeQueryService, LikeQueryService>();
        services.AddScoped<IMeQueryService, MeQueryService>();
        services.AddScoped<IArtistStudioQueryService, ArtistStudioQueryService>();
        services.AddScoped<IAdminArtistQueryService, AdminArtistQueryService>();
        services.AddScoped<IAdminTrackQueryService, AdminTrackQueryService>();
        services.AddScoped<ILookupQueryService, LookupQueryService>();

        services.AddScoped<IAccountFlowNotifier, AccountFlowNotifier>();
        services.AddScoped<IAccountRegistrationService, AccountRegistrationService>();
        services.AddScoped<IAccountRecoveryService, AccountRecoveryService>();
        services.AddScoped<IAuthSessionService, AuthSessionService>();
        services.AddScoped<IGoogleAccountService, GoogleAccountService>();
        services.AddScoped<IAuthWorkflowService, AuthWorkflowService>();

        services.AddScoped<IAdminTrackValidator, AdminTrackValidator>();
        services.AddScoped<ITrackReferenceValidationService, TrackReferenceValidationService>();
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    private static void RegisterInfrastructureServices(IServiceCollection services)
    {
        
        services.AddSingleton<IAccountLinkBuilder, AccountLinkBuilder>();
        services.AddSingleton<LoggingAccountEmailSender>();
        services.AddSingleton<SmtpAccountEmailSender>();
        services.AddSingleton<IAccountEmailSender>(serviceProvider =>
        {
            var emailOptions = serviceProvider.GetRequiredService<IOptions<EmailDeliveryOptions>>().Value;
            return emailOptions.UseSmtpProvider()
                ? serviceProvider.GetRequiredService<SmtpAccountEmailSender>()
                : serviceProvider.GetRequiredService<LoggingAccountEmailSender>();
        });

        services.AddTransient<IClaimsTransformation, ArtistOwnershipClaimsTransformation>();
        services.AddHostedService<UploadOrphanCleanupService>();
        services.AddHostedService<TrackPlayRetentionService>();
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureDatabase(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var connectionString = ResolveConnectionString(configuration, environment);
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));
        services.AddDbContextFactory<ApplicationDbContext>(
            options => options.UseSqlServer(connectionString),
            ServiceLifetime.Scoped);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureIdentity(IServiceCollection services)
    {
        services
            .AddIdentity<IdentityUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;

                options.Password.RequiredLength = 8;
                options.Password.RequiredUniqueChars = 4;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = true;
                options.Password.RequireDigit = true;

                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureExternalAuth(IServiceCollection services, IConfiguration configuration)
    {
        var googleAuthOptions = configuration.GetSection(GoogleAuthOptions.SectionName).Get<GoogleAuthOptions>() ?? new GoogleAuthOptions();
        if (!googleAuthOptions.IsConfigured())
        {
            return;
        }

        services
            .AddAuthentication()
            .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = googleAuthOptions.ClientId;
                options.ClientSecret = googleAuthOptions.ClientSecret;
                options.CallbackPath = googleAuthOptions.CallbackPath;
                options.SignInScheme = IdentityConstants.ExternalScheme;
                options.SaveTokens = false;
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
            });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureApplicationCookie(IServiceCollection services, CookieSecurePolicy secureCookiePolicy)
    {
        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "clarity_auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = secureCookiePolicy;
            options.SlidingExpiration = true;
            options.ExpireTimeSpan = TimeSpan.FromDays(7);

            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };

            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureAuthorization(IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureRateLimiting(IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("auth", context => BuildWindowLimiter(ResolveRateLimitKey(context), 10));
            options.AddPolicy("write", context => BuildWindowLimiter($"write:{ResolveRateLimitKey(context)}", 45));
            options.AddPolicy("admin-write", context => BuildWindowLimiter($"admin:{ResolveRateLimitKey(context)}", 30));
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureMediaPolicy(IConfiguration configuration, IWebHostEnvironment environment)
    {
        MediaUrlPolicy.Configure(
            environment.IsDevelopment() && configuration.GetValue<bool>("Media:AllowExternalDevUrls", false),
            configuration.GetSection("Media:AllowedExternalHosts").Get<string[]>() ?? Array.Empty<string>());
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static void ConfigureCors(IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = ResolveAllowedOrigins(configuration);
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .AllowAnyMethod();
            });
        });
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    private static FixedWindowRateLimiterOptions CreateWindowOptions(int permitLimit)
    {
        return new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static RateLimitPartition<string> BuildWindowLimiter(string key, int permitLimit)
    {
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => CreateWindowOptions(permitLimit));
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveConnectionString(IConfiguration configuration, IWebHostEnvironment environment)
    {
        
        var envConnection = Environment.GetEnvironmentVariable("CLARITY_DB_CONNECTION")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (!string.IsNullOrWhiteSpace(envConnection))
        {
            return envConnection;
        }

        var configured = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        if (environment.IsDevelopment())
        {
            return "Server=(localdb)\\MSSQLLocalDB;Database=CLARITY_music;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;";
        }

        throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured. Set CLARITY_DB_CONNECTION or ConnectionStrings__DefaultConnection.");
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string[] ResolveAllowedOrigins(IConfiguration configuration)
    {
        
        var configured = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        var envValue = Environment.GetEnvironmentVariable("CLARITY_ALLOWED_ORIGINS") ?? string.Empty;
        var envOrigins = envValue.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        var mergedOrigins = configured
            .Concat(envOrigins)
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (mergedOrigins.Length > 0)
        {
            return mergedOrigins;
        }

        return
        [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ];
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string ResolveRateLimitKey(HttpContext context)
    {
        
        return context.User?.Identity?.Name
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";
    }
}
