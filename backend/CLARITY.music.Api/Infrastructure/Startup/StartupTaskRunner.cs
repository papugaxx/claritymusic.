

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure.Startup;




public static class StartupTaskRunner
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static async Task RunClarityStartupTasksAsync(this WebApplication app, IConfiguration configuration)
    {
        if (!ShouldRunStartupTasks(configuration))
            return;

        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var db = services.GetRequiredService<ApplicationDbContext>();

        if (configuration.GetValue<bool>("Bootstrap:ApplyMigrationsOnStartup"))
        {
            db.Database.Migrate();
        }

        if (configuration.GetValue<bool>("Bootstrap:SeedIdentityOnStartup"))
        {
            await EnsureIdentityAsync(services, configuration, app.Environment, app.Logger);
        }

        if (configuration.GetValue<bool>("Bootstrap:CleanupOrphanUploadsOnStartup", true))
        {
            try
            {
                await ManagedUploadFiles.CleanupOrphanedFilesAsync(app.Environment, db, TimeSpan.FromHours(6));
            }
            catch (Exception ex)
            {
                app.Logger.LogWarning(ex, "Failed to clean up orphaned uploads on startup.");
            }
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool ShouldRunStartupTasks(IConfiguration configuration)
    {
        return configuration.GetValue<bool>("Bootstrap:ApplyMigrationsOnStartup")
            || configuration.GetValue<bool>("Bootstrap:SeedIdentityOnStartup")
            || configuration.GetValue<bool>("Bootstrap:CleanupOrphanUploadsOnStartup", true);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static bool ShouldAllowAdminBootstrap(IConfiguration configuration, IWebHostEnvironment environment)
    {
        if (!configuration.GetValue<bool>("Bootstrap:SeedIdentityOnStartup"))
            return false;

        if (!environment.IsDevelopment())
            return true;

        return configuration.GetValue<bool>("Bootstrap:AllowLocalDevAdminBootstrap", false);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static async Task EnsureIdentityAsync(
        IServiceProvider services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger logger)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();

        foreach (var role in new[] { "User", "Admin", "Artist" })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        if (!ShouldAllowAdminBootstrap(configuration, environment))
            return;

        var adminPassword = configuration["Admin:Password"]
            ?? Environment.GetEnvironmentVariable("CLARITY_ADMIN_PASSWORD")
            ?? "Admin123!";

        if (string.IsNullOrWhiteSpace(adminPassword) || adminPassword.Length < 8)
        {
            logger.LogInformation("Skipping admin bootstrap because Admin:Password / CLARITY_ADMIN_PASSWORD is not set or is too short.");
            return;
        }

        var adminEmail = configuration["Admin:Email"]
            ?? Environment.GetEnvironmentVariable("CLARITY_ADMIN_EMAIL")
            ?? "admin@clarity.music";

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new IdentityUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
            };

            var createResult = await userManager.CreateAsync(admin, adminPassword);
            if (!createResult.Succeeded)
            {
                logger.LogWarning(
                    "Failed to bootstrap the admin account {Email}: {Errors}",
                    adminEmail,
                    string.Join("; ", createResult.Errors.Select(error => error.Description)));
                return;
            }
        }

        foreach (var role in new[] { "User", "Admin" })
        {
            if (!await userManager.IsInRoleAsync(admin, role))
            {
                await userManager.AddToRoleAsync(admin, role);
            }
        }
    }
}
