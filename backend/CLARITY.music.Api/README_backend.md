<!-- Коментар пояснює призначення наступного XML блока -->

# CLARITY.music backend

<!-- Коментар пояснює призначення наступного XML блока -->
## Назначение
Серверная часть проекта CLARITY.music реализована на ASP.NET Core Web API и отвечает за:
- аутентификацию и авторизацию пользователей;
- работу с ролями User, Artist и Admin;
- управление данными каталога;
- избранное, плейлисты и профиль пользователя;
- публичные страницы артистов и artist studio;
- административные операции;
- загрузку изображений и аудиофайлов.

<!-- Коментар пояснює призначення наступного XML блока -->
## Технологии
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- ASP.NET Identity
- Cookie authentication

<!-- Коментар пояснює призначення наступного XML блока -->
## Требования к окружению
Для запуска backend необходимы:
- .NET SDK 10.0
- SQL Server или SQL Server LocalDB
- доступ к локальной файловой системе для загрузок и статики

<!-- Коментар пояснює призначення наступного XML блока -->
## Структура проекта
Основные каталоги:
- `Controllers` — HTTP API;
- `Application/Services` — прикладная логика и сервисы;
- `Domain` — сущности предметной области;
- `Infrastructure` — данные, загрузки, вспомогательные механизмы;
- `DTOs` — транспортные модели;
- `Migrations` — миграции базы данных.

Основной проект: `CLARITY.music.Api.csproj`.

<!-- Коментар пояснює призначення наступного XML блока -->
## Основные контроллеры
В проекте используются следующие основные API-контроллеры:
- `AuthController`
- `TracksController`
- `LikesController`
- `PlaylistsController`
- `MeController`
- `MeProfileController`
- `ArtistsController`
- `ArtistStudioController`
- `AdminTracksController`
- `AdminGenresController`
- `AdminMoodsController`
- `UploadsController`

<!-- Коментар пояснює призначення наступного XML блока -->
## Настройка конфигурации
Основные параметры задаются в:
- `appsettings.json`
- `appsettings.Development.json`
- переменных окружения

<!-- Коментар пояснює призначення наступного XML блока -->
### Важные настройки
#### Connection string
По умолчанию в development используется LocalDB:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\MSSQLLocalDB;Database=CLARITY_music;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;"
}
```

При необходимости можно задать подключение через переменные окружения:
- `CLARITY_DB_CONNECTION`
- `ConnectionStrings__DefaultConnection`

#### CORS
В `appsettings.Development.json` уже указаны локальные адреса для frontend-разработки (`localhost:5173`, `localhost:5174`, `localhost:4173`).

#### Bootstrap-параметры
В development-конфигурации доступны флаги:
- `ApplyMigrationsOnStartup`
- `SeedIdentityOnStartup`
- `AllowLocalDevAdminBootstrap`
- `SeedDemoDataOnStartup`
- `CleanupOrphanUploadsOnStartup`

Они позволяют автоматически подготовить локальное окружение для разработки.

<!-- Коментар пояснює призначення наступного XML блока -->
## Установка зависимостей
В каталоге backend выполните:
```bash
dotnet restore
```

<!-- Коментар пояснює призначення наступного XML блока -->
## Применение миграций
Рекомендуемый способ:
```bash
dotnet ef database update
```

Если `dotnet ef` не установлен глобально, его нужно установить отдельно.

Альтернативный вариант — включить `ApplyMigrationsOnStartup`, но для обычной локальной разработки удобнее явно применять миграции.

<!-- Коментар пояснює призначення наступного XML блока -->
## Запуск проекта
<!-- Коментар пояснює призначення наступного XML блока -->
### HTTP-профиль
```bash
dotnet run --launch-profile http
```

<!-- Коментар пояснює призначення наступного XML блока -->
### HTTPS-профиль
```bash
dotnet run --launch-profile https
```

По `launchSettings.json` backend запускается на:
- `http://localhost:5287`
- `https://localhost:7116`

<!-- Коментар пояснює призначення наступного XML блока -->
## Локальные учётные данные администратора
Если в development включены:
- `SeedIdentityOnStartup = true`
- `AllowLocalDevAdminBootstrap = true`

то backend может создать локального администратора.

По умолчанию используются:
- email: `admin@clarity.music`
- пароль: `Admin123!`

При необходимости их можно переопределить через переменные окружения:
- `CLARITY_ADMIN_EMAIL`
- `CLARITY_ADMIN_PASSWORD`

<!-- Коментар пояснює призначення наступного XML блока -->
## Работа со статикой и загрузками
Backend поддерживает:
- загрузку аватаров;
- загрузку обложек;
- загрузку аудиофайлов;
- удаление ранее загруженных файлов по допустимым сценариям.

Файлы используются приложением как обычный статический контент.

<!-- Коментар пояснює призначення наступного XML блока -->
## Что проверить после запуска
После старта backend рекомендуется проверить:
- применяется ли подключение к базе данных;
- создаются ли роли и демо-данные при включённом bootstrap;
- работает ли регистрация и вход;
- доступны ли endpoints каталога;
- работают ли лайки, плейлисты и профиль;
- работают ли artist studio и admin-маршруты;
- принимаются ли загрузки файлов;
- корректно ли отвечает API для frontend.

<!-- Коментар пояснює призначення наступного XML блока -->
## Минимальный сценарий локального запуска
1. Настроить строку подключения к SQL Server / LocalDB.
2. Выполнить `dotnet restore`.
3. Применить миграции: `dotnet ef database update`.
4. Убедиться, что в `appsettings.Development.json` корректно указан список `Cors:AllowedOrigins`.
5. Запустить backend через `dotnet run --launch-profile http`.
6. Запустить frontend и проверить основные пользовательские сценарии.

<!-- Коментар пояснює призначення наступного XML блока -->
## Примечание
Backend рассчитан на совместную работу с frontend CLARITY.music. Для полноценной проверки проекта рекомендуется запускать обе части одновременно.
