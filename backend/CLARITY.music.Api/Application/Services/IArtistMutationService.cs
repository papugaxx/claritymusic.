

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;

namespace CLARITY.music.Api.Application.Services;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IArtistMutationService
{
    Task<ArtistWriteResult> CreateAsync(ArtistMutationInput input, CancellationToken cancellationToken = default);
    Task<ArtistWriteResult> UpdateAsync(int artistId, ArtistMutationInput input, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteAsync(int artistId, CancellationToken cancellationToken = default);
}




// Record нижче задає компактну форму даних для передачі між шарами
public sealed record ArtistMutationInput(
    string? Name,
    string? Slug,
    string? AvatarUrl,
    string? CoverUrl,
    string? OwnerUserId = null,
    bool ValidateOwnerUser = false);




// Record нижче задає компактну форму даних для передачі між шарами
public sealed record ArtistWriteResult(Artist? Entity, ServiceResult? Error)
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public bool Succeeded => Error is null && Entity is not null;
}
