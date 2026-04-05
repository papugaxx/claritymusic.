

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Application.Services.Validation;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface ITrackReferenceValidationService
{
    Task<string?> ValidateArtistWriteAsync(int genreId, int? moodId, CancellationToken cancellationToken = default);
    Task<string?> ValidateAdminWriteAsync(int artistId, int genreId, int? moodId, CancellationToken cancellationToken = default);
}
