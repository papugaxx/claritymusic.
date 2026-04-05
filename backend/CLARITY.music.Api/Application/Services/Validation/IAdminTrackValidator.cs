

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;

namespace CLARITY.music.Api.Application.Services.Validation;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IAdminTrackValidator
{
    string? Validate(AdminTrackSaveRequest req);
}
