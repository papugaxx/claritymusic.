

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;

namespace CLARITY.music.Api.Infrastructure.Email;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class LoggingAccountEmailSender : IAccountEmailSender
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ILogger<LoggingAccountEmailSender> _logger;
    private readonly IWebHostEnvironment _environment;

    // Коментар коротко пояснює призначення наступного фрагмента
    public LoggingAccountEmailSender(ILogger<LoggingAccountEmailSender> logger, IWebHostEnvironment environment)
    {
        
        _logger = logger;
        _environment = environment;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task SendEmailConfirmationAsync(string email, string confirmationUrl, CancellationToken cancellationToken = default)
    {
        LogLink(
            "email confirmation",
            email,
            confirmationUrl,
            "Email sending is not configured. Replace LoggingAccountEmailSender with a real provider to deliver confirmation emails.");

        return Task.CompletedTask;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task SendPasswordResetAsync(string email, string resetUrl, CancellationToken cancellationToken = default)
    {
        LogLink(
            "password reset",
            email,
            resetUrl,
            "Email sending is not configured. Replace LoggingAccountEmailSender with a real provider to deliver password reset emails.");

        return Task.CompletedTask;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private void LogLink(string flowName, string email, string url, string productionMessage)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogInformation(
                "Development {FlowName} link for {Email}: {Url}",
                flowName,
                email,
                url);
            return;
        }

        _logger.LogWarning(
            "{ProductionMessage} Flow={FlowName}, Email={Email}",
            productionMessage,
            flowName,
            email);
    }
}
