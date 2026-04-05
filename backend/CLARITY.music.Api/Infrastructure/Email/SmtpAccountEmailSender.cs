

// Нижче підключаються простори назв які потрібні цьому модулю

using System.Net;
using System.Net.Mail;
using CLARITY.music.Api.Application.Options;
using CLARITY.music.Api.Application.Services;
using Microsoft.Extensions.Options;

namespace CLARITY.music.Api.Infrastructure.Email;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class SmtpAccountEmailSender : IAccountEmailSender
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly EmailDeliveryOptions _options;
    private readonly ILogger<SmtpAccountEmailSender> _logger;

    // Коментар коротко пояснює призначення наступного фрагмента
    public SmtpAccountEmailSender(IOptions<EmailDeliveryOptions> options, ILogger<SmtpAccountEmailSender> logger)
    {
        
        _options = options.Value;
        _logger = logger;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task SendEmailConfirmationAsync(string email, string confirmationUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Confirm your CLARITY.music email";
        var preview = "Confirm your email address to finish setting up your account.";
        var html = BuildHtmlMessage(
            title: "Confirm your email",
            intro: "Your account is almost ready. Confirm your email address to finish setup.",
            actionText: "Confirm email",
            actionUrl: confirmationUrl,
            helperText: "If the button does not open, copy the link below into your browser.",
            fallbackUrl: confirmationUrl);

        return SendAsync(email, subject, preview, html, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public Task SendPasswordResetAsync(string email, string resetUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Reset your CLARITY.music password";
        var preview = "Use this secure link to choose a new password for your account.";
        var html = BuildHtmlMessage(
            title: "Reset your password",
            intro: "We received a request to reset your password. Use the button below to choose a new one.",
            actionText: "Reset password",
            actionUrl: resetUrl,
            helperText: "If you did not request a password reset, you can safely ignore this email.",
            fallbackUrl: resetUrl);

        return SendAsync(email, subject, preview, html, cancellationToken);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private async Task SendAsync(string email, string subject, string previewText, string htmlBody, CancellationToken cancellationToken)
    {
        if (!_options.UseSmtpProvider())
            throw new InvalidOperationException("SMTP email delivery is not fully configured.");

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromEmail.Trim(), ResolveFromName()),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
            BodyEncoding = System.Text.Encoding.UTF8,
            SubjectEncoding = System.Text.Encoding.UTF8,
        };

        message.To.Add(new MailAddress(email.Trim()));
        if (!string.IsNullOrWhiteSpace(_options.ReplyToEmail))
        {
            message.ReplyToList.Add(new MailAddress(
                _options.ReplyToEmail.Trim(),
                string.IsNullOrWhiteSpace(_options.ReplyToName) ? ResolveFromName() : _options.ReplyToName.Trim()));
        }

        message.Headers.Add("X-Priority", "3");
        message.Headers.Add("X-CLARITY-Email-Flow", subject);
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(BuildTextBody(previewText, htmlBody), System.Text.Encoding.UTF8, "text/plain"));

        using var client = new SmtpClient(_options.Smtp.Host.Trim(), _options.Smtp.Port)
        {
            Credentials = new NetworkCredential(_options.Smtp.Username.Trim(), _options.Smtp.Password),
            EnableSsl = _options.Smtp.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };

        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message);
            cancellationToken.ThrowIfCancellationRequested();
            _logger.LogInformation("Sent account email via SMTP. Subject={Subject}, Recipient={Recipient}", subject, email);
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Failed to send account email via SMTP. Subject={Subject}, Recipient={Recipient}", subject, email);
            throw;
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private string ResolveFromName()
    {
        
        return string.IsNullOrWhiteSpace(_options.FromName) ? "CLARITY.music" : _options.FromName.Trim();
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string BuildTextBody(string previewText, string htmlBody)
    {
        var withoutTags = System.Text.RegularExpressions.Regex.Replace(htmlBody, "<[^>]+>", " ");
        var normalized = System.Text.RegularExpressions.Regex.Replace(withoutTags, "\\s+", " ").Trim();
        return string.Join(Environment.NewLine + Environment.NewLine, new[] { previewText, normalized });
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private static string BuildHtmlMessage(string title, string intro, string actionText, string actionUrl, string helperText, string fallbackUrl)
    {
        var safeTitle = WebUtility.HtmlEncode(title);
        var safeIntro = WebUtility.HtmlEncode(intro);
        var safeActionText = WebUtility.HtmlEncode(actionText);
        var safeActionUrl = WebUtility.HtmlEncode(actionUrl);
        var safeHelperText = WebUtility.HtmlEncode(helperText);
        var safeFallbackUrl = WebUtility.HtmlEncode(fallbackUrl);

        return $"""
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0d1020;font-family:Arial,Helvetica,sans-serif;color:#f5f1ff;">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:32px;background:linear-gradient(180deg,rgba(35,166,255,0.14),rgba(123,92,255,0.12));box-shadow:0 24px 60px rgba(0,0,0,0.34);">
        <div style="font-size:20px;font-weight:900;letter-spacing:-0.03em;margin-bottom:8px;">CLARITY<span style="color:#a995ff;">.music</span></div>
        <div style="font-size:28px;font-weight:800;line-height:1.2;margin:0 0 14px;">{safeTitle}</div>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:rgba(245,241,255,0.82);">{safeIntro}</p>
        <a href="{safeActionUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:linear-gradient(180deg,#35a8ff,#238bff);color:#05131f;font-size:15px;font-weight:800;text-decoration:none;">{safeActionText}</a>
        <p style="margin:22px 0 10px;font-size:13px;line-height:1.6;color:rgba(245,241,255,0.72);">{safeHelperText}</p>
        <div style="word-break:break-all;font-size:12px;line-height:1.6;color:#d2c9ff;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">{safeFallbackUrl}</div>
      </div>
    </div>
  </body>
</html>
""";
    }
}
