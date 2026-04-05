

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Email;
using Microsoft.AspNetCore.Identity;

namespace CLARITY.music.Api.Application.Services.Auth;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class AccountFlowNotifier : IAccountFlowNotifier
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IAccountLinkBuilder _accountLinkBuilder;
    private readonly IAccountEmailSender _accountEmailSender;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AccountFlowNotifier> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AccountFlowNotifier(
        UserManager<IdentityUser> userManager,
        IAccountLinkBuilder accountLinkBuilder,
        IAccountEmailSender accountEmailSender,
        IWebHostEnvironment environment,
        ILogger<AccountFlowNotifier> logger)
    {
        
        _userManager = userManager;
        _accountLinkBuilder = accountLinkBuilder;
        _accountEmailSender = accountEmailSender;
        _environment = environment;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task SendEmailConfirmationAsync(IdentityUser user, CancellationToken cancellationToken)
    {
        try
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var link = _accountLinkBuilder.BuildEmailConfirmationUrl(user.Id, token);
            await _accountEmailSender.SendEmailConfirmationAsync(user.Email ?? string.Empty, link, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to prepare the email confirmation flow for user {UserId}", user.Id);
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public async Task SendPasswordResetAsync(IdentityUser user, CancellationToken cancellationToken)
    {
        try
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var link = _accountLinkBuilder.BuildPasswordResetUrl(user.Email ?? string.Empty, token);
            await _accountEmailSender.SendPasswordResetAsync(user.Email ?? string.Empty, link, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to prepare the password reset flow for user {UserId}", user.Id);
        }
    }

    // Метод нижче повертає дані потрібні для поточного сценарію
    public string? GetDeliveryHint()
    {
        
        if (!_environment.IsDevelopment())
        {
            return null;
        }

        return _accountEmailSender is LoggingAccountEmailSender
            ? "In development, account links are written to the backend logs instead of being emailed."
            : null;
    }
}
