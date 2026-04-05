

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Http;

namespace CLARITY.music.Api.Application.Services;




// Клас нижче інкапсулює окрему відповідальність у межах цього модуля
public sealed class ServiceResult
{
    // Властивість нижче зберігає значення яке читають інші частини системи
    public int StatusCode { get; }
    // Властивість нижче зберігає значення яке читають інші частини системи
    public object Payload { get; }

    // Коментар коротко пояснює призначення наступного фрагмента
    private ServiceResult(int statusCode, object payload)
    {
        
        StatusCode = statusCode;
        Payload = payload;
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult Ok(object payload) => new(StatusCodes.Status200OK, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult BadRequest(object payload) => new(StatusCodes.Status400BadRequest, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult Unauthorized(object payload) => new(StatusCodes.Status401Unauthorized, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult NotFound(object payload) => new(StatusCodes.Status404NotFound, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult Forbidden(object payload) => new(StatusCodes.Status403Forbidden, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult Conflict(object payload) => new(StatusCodes.Status409Conflict, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult Locked(object payload) => new(StatusCodes.Status423Locked, payload);
    // Метод нижче виконує окрему частину логіки цього модуля
    public static ServiceResult ServerError(object payload) => new(StatusCodes.Status500InternalServerError, payload);
}
