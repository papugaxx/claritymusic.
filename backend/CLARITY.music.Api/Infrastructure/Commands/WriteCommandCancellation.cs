

// Простір назв групує пов'язані типи цього модуля в одному місці

namespace CLARITY.music.Api.Infrastructure.Commands;




public static class WriteCommandCancellation
{
    // Метод нижче виконує окрему частину логіки цього модуля
    public static CancellationToken Normalize(CancellationToken cancellationToken = default)
    {
        return CancellationToken.None;
    }
}
