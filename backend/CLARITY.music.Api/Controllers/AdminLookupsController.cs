

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/admin/lookups")]
[Authorize(Policy = "AdminOnly")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class AdminLookupsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ILookupQueryService _lookupQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminLookupsController(ILookupQueryService lookupQueries)
    {
        
        _lookupQueries = lookupQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> Get()
    {
        
        return Ok(await _lookupQueries.GetAdminAsync(HttpContext.RequestAborted));
    }
}
