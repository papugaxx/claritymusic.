

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ManagedUploadService : IManagedUploadService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly IWebHostEnvironment _env;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ManagedUploadService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public ManagedUploadService(IWebHostEnvironment env, ApplicationDbContext db, ILogger<ManagedUploadService> logger)
    {
        
        _env = env;
        _db = db;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> UploadAvatarAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default)
    {
        return UploadImageAsync(file, userId, Path.Combine("uploads", "avatars"), "avatarUrl", 5_000_000, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task<ServiceResult> UploadCoverAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default)
    {
        return UploadImageAsync(file, userId, Path.Combine("uploads", "covers"), "coverUrl", 8_000_000, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> UploadAudioAsync(IFormFile file, string? userId, CancellationToken cancellationToken = default)
    {
        if (!UploadValidation.TryValidateMp3(file, 25_000_000, out var error))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(error));
        }

        try
        {
            var folder = Path.Combine(_env.WebRootPath, "audio");
            var safeName = await UploadValidation.SaveAsync(file, folder, ".mp3");
            var publicUrl = $"/audio/{safeName}";
            RegisterTemporaryUpload(userId, publicUrl);

            return ServiceResult.Ok(new UploadResultDto
            {
                Url = publicUrl,
                Kind = "audio",
                AudioUrl = publicUrl,
            });
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogError(ex, "Failed to save uploaded audio file.");
            return ServiceResult.ServerError(ApiErrorResponse.Create("Could not save the uploaded audio file"));
        }
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteAsync(string? url, string userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("URL is required"));
        }

        var normalized = MediaUrlPolicy.NormalizePublicUrl(url);
        if (!ManagedUploadFiles.IsManagedPublicUrl(normalized))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Invalid file URL"));
        }

        var isReferenced = await ManagedUploadFiles.IsReferencedAsync(_db, normalized, cancellationToken);
        var canManageBoundEntity = await ManagedUploadFiles.CanUserManageFileAsync(_db, userId, isAdmin, normalized, cancellationToken);
        var canManageTemp = TemporaryUploadRegistry.CanDelete(userId, isAdmin, normalized);

        if (isReferenced && !canManageBoundEntity)
        {
            return ServiceResult.Forbidden(ApiErrorResponse.Create("The file belongs to another entity or user"));
        }

        if (!isReferenced && !canManageTemp && !isAdmin)
        {
            return ServiceResult.Forbidden(ApiErrorResponse.Create("A temporary file can only be deleted within the current upload session"));
        }

        return ServiceResult.Ok(new DeletionResponseDto
        {
            Deleted = ManagedUploadFiles.TryDeleteManagedFile(_env, normalized),
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task<ServiceResult> UploadImageAsync(
        IFormFile file,
        string? userId,
        string relativeFolder,
        string responseField,
        long maxBytes,
        CancellationToken cancellationToken)
    {
        if (!UploadValidation.TryValidateImage(file, maxBytes, out var error, out var extension))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(error));
        }

        try
        {
            var folder = Path.Combine(_env.WebRootPath, relativeFolder.Replace('/', Path.DirectorySeparatorChar));
            var safeName = await UploadValidation.SaveAsync(file, folder, extension);
            var publicUrl = "/" + relativeFolder.Replace("\\", "/").Trim('/') + "/" + safeName;

            RegisterTemporaryUpload(userId, publicUrl);
            return ServiceResult.Ok(BuildImageUploadResult(publicUrl, responseField));
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogError(ex, "Failed to save uploaded image file.");
            return ServiceResult.ServerError(ApiErrorResponse.Create("Could not save the uploaded image file"));
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static UploadResultDto BuildImageUploadResult(string publicUrl, string responseField)
    {
        var result = new UploadResultDto
        {
            Url = publicUrl,
            Kind = string.Equals(responseField, "avatarUrl", StringComparison.OrdinalIgnoreCase) ? "avatar" : "cover",
        };

        if (string.Equals(responseField, "avatarUrl", StringComparison.OrdinalIgnoreCase))
        {
            result.AvatarUrl = publicUrl;
        }
        else
        {
            result.CoverUrl = publicUrl;
        }

        return result;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    private static void RegisterTemporaryUpload(string? userId, string publicUrl)
    {
        
        if (!string.IsNullOrWhiteSpace(userId))
        {
            TemporaryUploadRegistry.Register(userId, publicUrl);
        }
    }
}
