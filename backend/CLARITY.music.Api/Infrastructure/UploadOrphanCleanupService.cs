

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class UploadOrphanCleanupService : BackgroundService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<UploadOrphanCleanupService> _logger;
    private readonly IConfiguration _configuration;

    // Коментар коротко пояснює призначення наступного фрагмента
    public UploadOrphanCleanupService(
        IServiceScopeFactory scopeFactory,
        IWebHostEnvironment environment,
        ILogger<UploadOrphanCleanupService> logger,
        IConfiguration configuration)
    {
        
        _scopeFactory = scopeFactory;
        _environment = environment;
        _logger = logger;
        _configuration = configuration;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = _configuration.GetValue<bool>("UploadsMaintenance:Enabled", true);
        if (!enabled)
            return;

        var intervalMinutes = Math.Clamp(_configuration.GetValue<int?>("UploadsMaintenance:IntervalMinutes") ?? 45, 5, 24 * 60);
        var orphanGraceMinutes = Math.Clamp(_configuration.GetValue<int?>("UploadsMaintenance:OrphanGraceMinutes") ?? 360, 30, 7 * 24 * 60);
        var timer = new PeriodicTimer(TimeSpan.FromMinutes(intervalMinutes));

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await RunCleanupAsync(TimeSpan.FromMinutes(orphanGraceMinutes), stoppingToken);
                await timer.WaitForNextTickAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            timer.Dispose();
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task RunCleanupAsync(TimeSpan orphanGrace, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (!await db.Database.CanConnectAsync(cancellationToken))
                return;

            await ManagedUploadFiles.CleanupOrphanedFilesAsync(_environment, db, orphanGrace, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Background orphan upload cleanup failed");
        }
    }
}
