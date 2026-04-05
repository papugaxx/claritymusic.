

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Інтерфейс нижче описує контракт якого мають дотримуватися реалізації
public interface IGoogleAccountService
{
    Task<IdentityUser?> FindOrCreateAsync(ExternalLoginInfo info);
}
