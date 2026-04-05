

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Infrastructure.Realtime;




public static class OperationsHubGroups
{
    // Поле нижче тримає залежність або службовий стан для подальшої роботи
    public const string Admins = "operations:admins";

    // Метод нижче виконує окрему частину логіки цього модуля
    public static string ForArtist(int artistId)
    {
        
        return $"operations:artist:{artistId}";
    }
}
