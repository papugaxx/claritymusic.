

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AccountRecoveryService : IAccountRecoveryService
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IAccountFlowNotifier _accountFlowNotifier;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AccountRecoveryService(
        UserManager<IdentityUser> userManager,
        IAccountFlowNotifier accountFlowNotifier)
    {
        
        _userManager = userManager;
        _accountFlowNotifier = accountFlowNotifier;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var email = AuthFlowHelpers.NormalizeEmail(request.Email);
        if (!string.IsNullOrWhiteSpace(email))
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user is not null && await _userManager.IsEmailConfirmedAsync(user))
            {
                await _accountFlowNotifier.SendPasswordResetAsync(user, cancellationToken);
            }
        }

        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            Message = "If an account with this email exists, password reset instructions have been prepared.",
            DeliveryHint = _accountFlowNotifier.GetDeliveryHint(),
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var email = AuthFlowHelpers.NormalizeEmail(request.Email);
        var newPassword = request.NewPassword ?? string.Empty;
        var confirmPassword = request.ConfirmNewPassword ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(newPassword))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("Missing required password reset data"));
        }

        if (!string.Equals(newPassword, confirmPassword, StringComparison.Ordinal))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The new password and confirmation password do not match"));
        }

        var decodedToken = AuthFlowHelpers.DecodeToken(request.Token);
        if (decodedToken is null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The password reset link is invalid or has expired"));
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The password reset link is invalid or has expired"));
        }

        var result = await _userManager.ResetPasswordAsync(user, decodedToken, newPassword);
        if (!result.Succeeded)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create(AuthFlowHelpers.MapIdentityErrors(result.Errors, "Could not reset the password.")));
        }

        await _userManager.ResetAccessFailedCountAsync(user);
        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            Message = "Password updated successfully",
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ConfirmEmailAsync(ConfirmEmailRequestDto request)
    {
        var userId = (request.UserId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(request.Token))
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The email confirmation link is invalid or has expired"));
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The email confirmation link is invalid or has expired"));
        }

        if (user.EmailConfirmed)
        {
            return BuildAlreadyConfirmedResponse();
        }

        var decodedToken = AuthFlowHelpers.DecodeToken(request.Token);
        if (decodedToken is null)
        {
            return ServiceResult.BadRequest(ApiErrorResponse.Create("The email confirmation link is invalid or has expired"));
        }

        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
        if (!result.Succeeded)
        {
            var refreshedUser = await _userManager.FindByIdAsync(userId);
            if (refreshedUser?.EmailConfirmed == true)
            {
                return BuildAlreadyConfirmedResponse();
            }

            return ServiceResult.BadRequest(ApiErrorResponse.Create(AuthFlowHelpers.MapIdentityErrors(result.Errors, "The email confirmation link is invalid or has expired")));
        }

        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            Message = "Email address confirmed successfully",
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task<ServiceResult> ResendConfirmationAsync(ResendConfirmationRequestDto request, CancellationToken cancellationToken = default)
    {
        var email = AuthFlowHelpers.NormalizeEmail(request.Email);
        if (!string.IsNullOrWhiteSpace(email))
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user is not null && !user.EmailConfirmed)
            {
                await _accountFlowNotifier.SendEmailConfirmationAsync(user, cancellationToken);
            }
        }

        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            Message = "If an account with this email exists and is still unconfirmed, a new confirmation email has been prepared.",
            DeliveryHint = _accountFlowNotifier.GetDeliveryHint(),
        });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static ServiceResult BuildAlreadyConfirmedResponse()
    {
        return ServiceResult.Ok(new AuthOperationResponseDto
        {
            Ok = true,
            AlreadyConfirmed = true,
            Message = "Email address is already confirmed",
        });
    }
}
