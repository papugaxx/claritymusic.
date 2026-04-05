

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Infrastructure;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class TrackPlayRetentionService : BackgroundService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IServiceProvider _services;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TrackPlayRetentionService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public TrackPlayRetentionService(IServiceProvider services, IConfiguration configuration, ILogger<TrackPlayRetentionService> logger)
    {
        
        _services = services;
        _configuration = configuration;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var enabled = _configuration.GetValue<bool>("TrackPlayMaintenance:Enabled");
                if (enabled)
                {
                    await CleanupOnce(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TrackPlay retention cleanup failed");
            }

            var intervalHours = Math.Max(1, _configuration.GetValue<int?>("TrackPlayMaintenance:IntervalHours") ?? 24);
            await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task CleanupOnce(CancellationToken cancellationToken)
    {
        var retentionDays = Math.Max(1, _configuration.GetValue<int?>("TrackPlayMaintenance:RetentionDays") ?? 90);
        var batchSize = Math.Max(100, _configuration.GetValue<int?>("TrackPlayMaintenance:BatchSize") ?? 1000);
        var cutoffUtc = DateTime.UtcNow.AddDays(-retentionDays);

        while (!cancellationToken.IsCancellationRequested)
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var ids = await db.TrackPlays
                .Where(tp => tp.PlayedAt < cutoffUtc)
                .OrderBy(tp => tp.Id)
                .Select(tp => tp.Id)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (ids.Count == 0) break;

            await db.TrackPlays.Where(tp => ids.Contains(tp.Id)).ExecuteDeleteAsync(cancellationToken);
            _logger.LogInformation("Deleted {Count} old TrackPlay rows older than {CutoffUtc}", ids.Count, cutoffUtc);
            if (ids.Count < batchSize) break;
        }
    }
}
