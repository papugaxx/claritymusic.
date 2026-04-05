

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.DTOs;




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class RegisterRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Password { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsArtist { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? DisplayName { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class LoginRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Password { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ForgotPasswordRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ResetPasswordRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Token { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? NewPassword { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? ConfirmNewPassword { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ConfirmEmailRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? UserId { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Token { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ResendConfirmationRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class ChangePasswordRequestDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? CurrentPassword { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? NewPassword { get; set; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? ConfirmNewPassword { get; set; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class AuthOperationResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool Ok { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool? RequiresEmailConfirmation { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool? AlreadyConfirmed { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Message { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? DeliveryHint { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class AuthErrorResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string Error { get; init; } = string.Empty;
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool? RequiresEmailConfirmation { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? DeliveryHint { get; init; }
}




// Клас нижче описує форму даних для обміну між шарами застосунку
public sealed class AuthMeResponseDto
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsAuthenticated { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Id { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? UserId { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Email { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool EmailConfirmed { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Username { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? Name { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? DisplayName { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public string? AvatarUrl { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsAdmin { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public bool IsArtist { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int? ArtistId { get; init; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
}
