

// Нижче підключаються простори назв які потрібні цьому модулю

using Microsoft.AspNetCore.Http;

namespace CLARITY.music.Api.Infrastructure;




public static class UploadValidation
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    private static readonly HashSet<string> AllowedAudioContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "audio/mpeg", "audio/mp3"
    };

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public static bool TryValidateImage(IFormFile? file, long maxBytes, out string error, out string extension)
    {
        error = string.Empty;
        extension = string.Empty;

        if (file == null || file.Length == 0)
        {
            error = "A file is required";
            return false;
        }

        extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(extension))
        {
            error = "Only jpg, jpeg, png, and webp files are allowed";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedImageContentTypes.Contains(file.ContentType))
        {
            error = "Unsupported image content type";
            return false;
        }

        if (file.Length > maxBytes)
        {
            error = $"File is too large (maximum {maxBytes / 1_000_000} MB)";
            return false;
        }

        try
        {
            using var stream = file.OpenReadStream();
            Span<byte> header = stackalloc byte[12];
            var read = stream.Read(header);
            if (read < 8)
            {
                error = "Invalid image file";
                return false;
            }

            if (extension is ".jpg" or ".jpeg")
            {
                if (header[0] != 0xFF || header[1] != 0xD8)
                {
                    error = "Invalid JPEG file";
                    return false;
                }
            }
            else if (extension == ".png")
            {
                byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                if (!header[..8].SequenceEqual(png))
                {
                    error = "Invalid PNG file";
                    return false;
                }
            }
            else if (extension == ".webp")
            {
                var riff = System.Text.Encoding.ASCII.GetString(header[..4]);
                var webp = System.Text.Encoding.ASCII.GetString(header.Slice(8, 4));
                if (!string.Equals(riff, "RIFF", StringComparison.Ordinal) || !string.Equals(webp, "WEBP", StringComparison.Ordinal))
                {
                    error = "Invalid WEBP file";
                    return false;
                }
            }

            return true;
        }
        catch
        {
            error = "Could not validate the image file";
            return false;
        }
    }

    // Метод нижче перевіряє коректність вхідних даних перед подальшими діями
    public static bool TryValidateMp3(IFormFile? file, long maxBytes, out string error)
    {
        error = string.Empty;

        if (file == null || file.Length == 0)
        {
            error = "A file is required";
            return false;
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".mp3")
        {
            error = "Only .mp3 files are allowed";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedAudioContentTypes.Contains(file.ContentType))
        {
            error = "Unsupported audio content type";
            return false;
        }

        if (file.Length > maxBytes)
        {
            error = $"File is too large (maximum {maxBytes / 1_000_000} MB)";
            return false;
        }

        try
        {
            using var stream = file.OpenReadStream();
            Span<byte> header = stackalloc byte[3];
            var read = stream.Read(header);
            if (read < 2)
            {
                error = "Invalid MP3 file";
                return false;
            }

            var isId3 = read == 3 && header[0] == (byte)'I' && header[1] == (byte)'D' && header[2] == (byte)'3';
            var isFrameSync = header[0] == 0xFF && (header[1] & 0xE0) == 0xE0;
            if (!isId3 && !isFrameSync)
            {
                error = "Invalid MP3 file";
                return false;
            }

            return true;
        }
        catch
        {
            error = "Could not validate the MP3 file";
            return false;
        }
    }

    // Метод нижче виконує окрему частину логіки цього модуля
    public static async Task<string> SaveAsync(IFormFile file, string rootFolder, string extension)
    {
        Directory.CreateDirectory(rootFolder);
        var safeName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(rootFolder, safeName);

        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        return safeName;
    }
}
