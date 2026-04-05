

// Нижче підключаються простори назв які потрібні цьому модулю

using CLARITY.music.Api.Infrastructure.Startup;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddClarityApi(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseClarityApi(builder.Configuration);
await app.RunClarityStartupTasksAsync(builder.Configuration);

app.Run();
