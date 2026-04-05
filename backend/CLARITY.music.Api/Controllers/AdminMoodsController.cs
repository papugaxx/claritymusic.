

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Application.Services;
using CLARITY.music.Api.Application.Services.Queries;
using CLARITY.music.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading;

namespace CLARITY.music.Api.Controllers;




[ApiController]
[Route("api/admin/moods")]
[Authorize(Policy = "AdminOnly")]
// Клас нижче приймає HTTP запити і передає роботу внутрішнім сервісам
public class AdminMoodsController : ControllerBase
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private readonly ILookupMutationService _lookupMutations;
    private readonly ILookupQueryService _lookupQueries;

    // Коментар коротко пояснює призначення наступного фрагмента
    public AdminMoodsController(ILookupMutationService lookupMutations, ILookupQueryService lookupQueries)
    {
        
        _lookupMutations = lookupMutations;
        _lookupQueries = lookupQueries;
    }

    [HttpGet]
    // Метод нижче повертає дані потрібні для поточного сценарію
    public async Task<IActionResult> GetAll()
    {
        
        return Ok(await _lookupQueries.GetMoodsAsync(HttpContext.RequestAborted));
    }

    [EnableRateLimiting("admin-write")]
    [HttpPost]
    // Метод нижче створює нову сутність або запускає сценарій додавання
    public async Task<IActionResult> Create([FromBody] NamedLookupSaveRequest request)
    {
        
        var result = await _lookupMutations.CreateMoodAsync(request, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("admin-write")]
    [HttpPut("{id:int}")]
    // Метод нижче оновлює наявні дані згідно з вхідними параметрами
    public async Task<IActionResult> Update(int id, [FromBody] NamedLookupSaveRequest request)
    {
        
        var result = await _lookupMutations.UpdateMoodAsync(id, request, User.Identity?.Name, CancellationToken.None);
        return ToActionResult(result);
    }

    [EnableRateLimiting("admin-write")]
    [HttpDelete("{id:int}")]
    // Метод нижче видаляє сутність або розриває пов'язаний звязок
    public async Task<IActionResult> Delete(int id)
    {
        
        var result = await _lookupMutations.DeleteMoodAsync(id, CancellationToken.None);
        return ToActionResult(result);
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    private IActionResult ToActionResult(ServiceResult result)
    {
        return StatusCode(result.StatusCode, result.Payload);
    }
}
