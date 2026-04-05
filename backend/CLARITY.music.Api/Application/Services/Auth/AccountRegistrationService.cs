

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Domain;
using CLARITY.music.Api.DTOs;
using CLARITY.music.Api.Infrastructure;
using CLARITY.music.Api.Infrastructure.Data;
using CLARITY.music.Api.Infrastructure.Commands;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AccountRegistrationService : IAccountRegistrationService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly IArtistOwnershipService _artistOwnership;
    private readonly IAccountFlowNotifier _accountFlowNotifier;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AccountRegistrationService(
        UserManager<IdentityUser> userManager,
        ApplicationDbContext db,
        IArtistOwnershipService artistOwnership,
        IAccountFlowNotifier accountFlowNotifier)
    {
        
        _userManager = userManager;
        _db = db;
        _artistOwnership = artistOwnership;
        _accountFlowNotifier = accountFlowNotifier;
    }

    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<ServiceResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        
        var writeCancellationToken = WriteCommandCancellation.Normalize(cancellationToken);
        var email = AuthFlowHelpers.NormalizeEmail(request.Email);
        var password = request.Password ?? string.Empty;
        var displayName = string.IsNullOrWhiteSpace(request.DisplayName)
            ? null
            : request.DisplayName.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Email and password are required"));
        }

        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            return ServiceResult.Conflict(ApiErrorResponse.Create("A user with this email already exists"));
        }

        string? artistName = null;
        if (request.IsArtist)
        {
            artistName = AuthFlowHelpers.NormalizeArtistName(displayName, email);
            var duplicateArtist = await _db.Artists
                .AsNoTracking()
                .AnyAsync(artist => EF.Functions.Collate(artist.Name, DbText.CaseInsensitiveCollation) == artistName, writeCancellationToken);

            if (duplicateArtist)
            {
                return ServiceResult.Conflict(ApiErrorResponse.Create("The artist name is already in use"));
            }
        }

        IdentityUser? createdUser = null;
        await using var transaction = await _db.Database.BeginTransactionAsync(writeCancellationToken);

        try
        {
            createdUser = new IdentityUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = false,
                LockoutEnabled = true,
            };

            var createResult = await _userManager.CreateAsync(createdUser, password);
            if (!createResult.Succeeded)
            {
                return ServiceResult.BadRequest(ApiErrorResponse.Create(AuthFlowHelpers.MapIdentityErrors(createResult.Errors, "Could not create the account.")));
            }

            var addUserRoleResult = await _userManager.AddToRoleAsync(createdUser, "User");
            if (!addUserRoleResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join("; ", addUserRoleResult.Errors.Select(error => error.Description)));
            }

            _db.UserProfiles.Add(new UserProfile
            {
                UserId = createdUser.Id,
                DisplayName = string.IsNullOrWhiteSpace(displayName) ? email.Split('@')[0] : displayName!,
                UpdatedAt = DateTime.UtcNow,
            });

            Artist? artist = null;
            if (request.IsArtist)
            {
                artist = new Artist
                {
                    Name = artistName!,
                    CreatedAt = DateTime.UtcNow,
                };

                _db.Artists.Add(artist);
            }

            await _db.SaveChangesAsync(writeCancellationToken);

            if (artist is not null)
            {
                await _artistOwnership.SetOwnerAsync(artist.Id, createdUser.Id, writeCancellationToken);
            }

            await transaction.CommitAsync(writeCancellationToken);
            await _accountFlowNotifier.SendEmailConfirmationAsync(createdUser, writeCancellationToken);

            return ServiceResult.Ok(new AuthOperationResponseDto
            {
                Ok = true,
                RequiresEmailConfirmation = true,
                Email = email,
                DeliveryHint = _accountFlowNotifier.GetDeliveryHint(),
            });
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            if (createdUser is not null)
            {
                await _userManager.DeleteAsync(createdUser);
            }

            return ServiceResult.Conflict(ApiErrorResponse.Create(request.IsArtist
                ? "The artist name is already in use"
                : "Could not save the account"));
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            if (createdUser is not null)
            {
                await _userManager.DeleteAsync(createdUser);
            }

            throw;
        }
    }
}
