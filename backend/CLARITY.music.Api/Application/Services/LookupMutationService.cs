

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LookupMutationService : ILookupMutationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private const string FallbackGenreName = "Uncategorized";

    private readonly ApplicationDbContext _db;
    private readonly ILogger<LookupMutationService> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LookupMutationService(ApplicationDbContext db, ILogger<LookupMutationService> logger)
    {
        
        _db = db;
        _logger = logger;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> CreateGenreAsync(NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var nameResult = await ValidateGenreNameAsync(request.Name, currentId: null, cancellationToken);
        if (!nameResult.Succeeded)
        {
            return ToServiceResult(nameResult);
        }

        var genre = new Genre { Name = nameResult.Value! };
        _db.Genres.Add(genre);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} created genre {GenreId} '{GenreName}'", actorEmail ?? "unknown", genre.Id, genre.Name);
        return ServiceResult.Ok(ToLookupDto(genre));
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateGenreAsync(int id, NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var genre = await _db.Genres.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (genre is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Genre not found"));
        }

        var nameResult = await ValidateGenreNameAsync(request.Name, id, cancellationToken);
        if (!nameResult.Succeeded)
        {
            return ToServiceResult(nameResult);
        }

        genre.Name = nameResult.Value!;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} updated genre {GenreId} '{GenreName}'", actorEmail ?? "unknown", genre.Id, genre.Name);
        return ServiceResult.Ok(ToLookupDto(genre));
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteGenreAsync(int id, CancellationToken cancellationToken = default)
    {
        var genre = await _db.Genres.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (genre is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Genre not found"));
        }

        var tracksUsingGenre = await _db.Tracks.Where(track => track.GenreId == id).ToListAsync(cancellationToken);
        if (tracksUsingGenre.Count > 0)
        {
            var fallbackGenre = await EnsureFallbackGenreAsync(cancellationToken);
            foreach (var track in tracksUsingGenre)
            {
                track.GenreId = fallbackGenre.Id;
            }
        }

        _db.Genres.Remove(genre);
        await _db.SaveChangesAsync(cancellationToken);

        return ServiceResult.Ok(new OperationResponseDto { Ok = true });
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> CreateMoodAsync(NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var nameResult = await ValidateMoodNameAsync(request.Name, currentId: null, cancellationToken);
        if (!nameResult.Succeeded)
        {
            return ToServiceResult(nameResult);
        }

        var mood = new Mood { Name = nameResult.Value! };
        _db.Moods.Add(mood);
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} created mood {MoodId} '{MoodName}'", actorEmail ?? "unknown", mood.Id, mood.Name);
        return ServiceResult.Ok(ToLookupDto(mood));
    }

    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<ServiceResult> UpdateMoodAsync(int id, NamedLookupSaveRequest request, string? actorEmail, CancellationToken cancellationToken = default)
    {
        var mood = await _db.Moods.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (mood is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Mood not found"));
        }

        var nameResult = await ValidateMoodNameAsync(request.Name, id, cancellationToken);
        if (!nameResult.Succeeded)
        {
            return ToServiceResult(nameResult);
        }

        mood.Name = nameResult.Value!;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ADMIN {Email} updated mood {MoodId} '{MoodName}'", actorEmail ?? "unknown", mood.Id, mood.Name);
        return ServiceResult.Ok(ToLookupDto(mood));
    }

    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<ServiceResult> DeleteMoodAsync(int id, CancellationToken cancellationToken = default)
    {
        var mood = await _db.Moods.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (mood is null)
        {
            return ServiceResult.NotFound(ApiErrorResponse.Create("Mood not found"));
        }

        var usedTracks = await _db.Tracks.Where(track => track.MoodId == id).ToListAsync(cancellationToken);
        foreach (var track in usedTracks)
        {
            track.MoodId = null;
        }

        _db.Moods.Remove(mood);
        await _db.SaveChangesAsync(cancellationToken);
        return ServiceResult.Ok(new OperationResponseDto { Ok = true });
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private async Task<ValidationValueResult> ValidateGenreNameAsync(string? rawName, int? currentId, CancellationToken cancellationToken)
    {
        var name = LookupNamePolicy.Normalize(rawName);
        if (name is null)
        {
            return ValidationValueResult.BadRequest("Genre name must contain between 2 and 50 characters");
        }

        var exists = await _db.Genres.AnyAsync(
            item => (!currentId.HasValue || item.Id != currentId.Value) && EF.Functions.Collate(item.Name, DbText.CaseInsensitiveCollation) == name,
            cancellationToken);

        return exists
            ? ValidationValueResult.Conflict("A genre with this name already exists")
            : ValidationValueResult.Success(name);
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    private async Task<ValidationValueResult> ValidateMoodNameAsync(string? rawName, int? currentId, CancellationToken cancellationToken)
    {
        var name = LookupNamePolicy.Normalize(rawName);
        if (name is null)
        {
            return ValidationValueResult.BadRequest("Mood name must contain between 2 and 50 characters");
        }

        var exists = await _db.Moods.AnyAsync(
            item => (!currentId.HasValue || item.Id != currentId.Value) && EF.Functions.Collate(item.Name, DbText.CaseInsensitiveCollation) == name,
            cancellationToken);

        return exists
            ? ValidationValueResult.Conflict("A mood with this name already exists")
            : ValidationValueResult.Success(name);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task<Genre> EnsureFallbackGenreAsync(CancellationToken cancellationToken)
    {
        var fallbackGenre = await _db.Genres.FirstOrDefaultAsync(item => item.Name == FallbackGenreName, cancellationToken);
        if (fallbackGenre is not null)
        {
            return fallbackGenre;
        }

        fallbackGenre = new Genre { Name = FallbackGenreName };
        _db.Genres.Add(fallbackGenre);
        await _db.SaveChangesAsync(cancellationToken);
        return fallbackGenre;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static LookupItemDto ToLookupDto(Genre genre)
    {
        
        return new LookupItemDto { Id = genre.Id, Name = genre.Name };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static LookupItemDto ToLookupDto(Mood mood)
    {
        
        return new LookupItemDto { Id = mood.Id, Name = mood.Name };
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static ServiceResult ToServiceResult(ValidationValueResult result)
    {
        return result.StatusCode switch
        {
            StatusCodes.Status400BadRequest => ServiceResult.BadRequest(ApiErrorResponse.Create(result.Error ?? "Validation failed")),
            StatusCodes.Status409Conflict => ServiceResult.Conflict(ApiErrorResponse.Create(result.Error ?? "Validation conflict")),
            StatusCodes.Status404NotFound => ServiceResult.NotFound(ApiErrorResponse.Create(result.Error ?? "Item not found")),
            StatusCodes.Status401Unauthorized => ServiceResult.Unauthorized(ApiErrorResponse.Create(result.Error ?? "Unauthorized")),
            StatusCodes.Status403Forbidden => ServiceResult.Forbidden(ApiErrorResponse.Create(result.Error ?? "Forbidden")),
            StatusCodes.Status423Locked => ServiceResult.Locked(ApiErrorResponse.Create(result.Error ?? "Locked")),
            _ => ServiceResult.BadRequest(ApiErrorResponse.Create(result.Error ?? "Validation failed"))
        };
    }

    // Record нижче задає компактну форму даних для передачі між шарами
    private sealed record ValidationValueResult(bool Succeeded, int StatusCode, string? Error, string? Value)
    {
        // Метод нижче виконує окрему частину логіки цього модуля
        public static ValidationValueResult Success(string value) => new(true, StatusCodes.Status200OK, null, value);
        // Метод нижче виконує окрему частину логіки цього модуля
        public static ValidationValueResult BadRequest(string error) => new(false, StatusCodes.Status400BadRequest, error, null);
        // Метод нижче виконує окрему частину логіки цього модуля
        public static ValidationValueResult Conflict(string error) => new(false, StatusCodes.Status409Conflict, error, null);
    }
}
