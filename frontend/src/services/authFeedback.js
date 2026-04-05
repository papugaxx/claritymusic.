

// Константа нижче зберігає повторно використане службове значення

const MESSAGES = {
  RATE_LIMIT: {
    uk: "Забагато спроб за короткий час. Зачекайте трохи й спробуйте ще раз.",
    ru: "Слишком много попыток за короткое время. Немного подождите и попробуйте снова.",
    en: "Too many attempts in a short time. Wait a bit and try again.",
  },
  ACCOUNT_LOCKED: {
    uk: "Вхід тимчасово заблоковано після кількох невдалих спроб. Спробуйте трохи пізніше або скористайтеся відновленням пароля.",
    ru: "Вход временно заблокирован после нескольких неудачных попыток. Попробуйте позже или восстановите пароль.",
    en: "Sign-in is temporarily locked after several failed attempts. Try again later or reset your password.",
  },
  INVALID_CREDENTIALS: {
    uk: "Не вдалося увійти. Перевірте email і пароль.",
    ru: "Не удалось войти. Проверьте email и пароль.",
    en: "Could not sign in. Check your email and password.",
  },
  EMAIL_NOT_CONFIRMED: {
    uk: "Спочатку підтвердіть email, а потім поверніться до входу.",
    ru: "Сначала подтвердите email, а затем вернитесь ко входу.",
    en: "Confirm your email first, then return to sign in.",
  },
  INVALID_LINK: {
    uk: "Це посилання більше не підходить. Запросіть новий лист і спробуйте ще раз.",
    ru: "Эта ссылка уже не подходит. Запросите новое письмо и попробуйте ещё раз.",
    en: "This link can no longer be used. Request a new email and try again.",
  },
  ALREADY_PROCESSED: {
    uk: "Схоже, ця дія вже була виконана. Спробуйте продовжити далі.",
    ru: "Похоже, это действие уже было выполнено. Попробуйте просто продолжить дальше.",
    en: "It looks like this action has already been completed. Try continuing.",
  },
  PASSWORD_MISMATCH: {
    uk: "Новий пароль і підтвердження не збігаються.",
    ru: "Новый пароль и подтверждение не совпадают.",
    en: "The new password and confirmation do not match.",
  },
  PASSWORD_POLICY: {
    uk: "Пароль не відповідає вимогам безпеки. Перевірте довжину та склад пароля.",
    ru: "Пароль не соответствует требованиям безопасности. Проверьте длину и состав пароля.",
    en: "The password does not meet the security requirements. Check its length and composition.",
  },
  NETWORK: {
    uk: "Не вдалося зв’язатися із сервером. Перевірте підключення й спробуйте ще раз.",
    ru: "Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.",
    en: "Could not reach the server. Check your connection and try again.",
  },
  GOOGLE_NOT_CONFIGURED: {
    uk: "Вхід через Google ще не налаштований. Заповніть client ID і client secret, а потім спробуйте знову.",
    ru: "Вход через Google ещё не настроен. Заполните client ID и client secret, а затем попробуйте снова.",
    en: "Google sign-in is not configured yet. Add the client ID and client secret, then try again.",
  },
  GOOGLE_ACCESS_DENIED: {
    uk: "Вхід через Google було скасовано або не дозволено.",
    ru: "Вход через Google был отменён или не разрешён.",
    en: "Google sign-in was cancelled or not approved.",
  },
  GOOGLE_EMAIL_REQUIRED: {
    uk: "Google не повернув адресу email для цього акаунта. Спробуйте інший акаунт або звичайний вхід.",
    ru: "Google не вернул адрес email для этого аккаунта. Попробуйте другой аккаунт или обычный вход.",
    en: "Google did not return an email address for this account. Try another account or the regular sign-in flow.",
  },
  GOOGLE_EMAIL_NOT_VERIFIED: {
    uk: "Цей Google-акаунт не має підтвердженої пошти. Підтвердіть email у Google й спробуйте ще раз.",
    ru: "У этого Google-аккаунта нет подтверждённой почты. Подтвердите email в Google и попробуйте снова.",
    en: "This Google account does not have a verified email address yet. Verify it in Google and try again.",
  },
  GOOGLE_LOGIN_FAILED: {
    uk: "Не вдалося завершити вхід через Google. Спробуйте ще раз або скористайтеся звичайним входом.",
    ru: "Не удалось завершить вход через Google. Попробуйте ещё раз или воспользуйтесь обычным входом.",
    en: "Could not finish Google sign-in. Try again or use the regular sign-in flow.",
  },
  GOOGLE_SESSION_NOT_READY: {
    uk: "Google підтвердив вхід, але локальна сесія ще не готова. Оновіть сторінку або спробуйте увійти ще раз.",
    ru: "Google подтвердил вход, но локальная сессия ещё не готова. Обновите страницу или попробуйте войти ещё раз.",
    en: "Google accepted the sign-in, but the local session is not ready yet. Refresh the page or try again.",
  },
  UNKNOWN: {
    uk: "Щось пішло не так. Спробуйте ще раз.",
    ru: "Что-то пошло не так. Попробуйте ещё раз.",
    en: "Something went wrong. Please try again.",
  },
};

// Функція нижче інкапсулює окрему частину логіки цього модуля
function pickLocale(locale) {
  return ["uk", "ru", "en"].includes(locale) ? locale : "uk";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function detectAuthErrorCode(input) {
  const hasStatus = input?.status !== undefined && input?.status !== null;
  const status = hasStatus ? Number(input.status) : null;
  const raw = String(input?.rawError || input?.error || input?.message || "").trim();
  const lower = raw.toLowerCase();

  if (status === 429 || /429|too many requests|rate limit/i.test(raw)) return "RATE_LIMIT";
  if (status === 423 || /locked|заблоковано|заблокирован/i.test(raw)) return "ACCOUNT_LOCKED";
  if (status === 401 || /невірна пошта або пароль|неверная почта или пароль|invalid email or password|invalid credentials/i.test(lower)) return "INVALID_CREDENTIALS";
  if ((status === 403 && input?.data?.requiresEmailConfirmation) || /confirm.*email|підтвердіть електронну пошту|подтвердите электронную почту/i.test(lower)) return "EMAIL_NOT_CONFIRMED";
  if (/mismatch|не збігаються|не совпадают/i.test(lower)) return "PASSWORD_MISMATCH";
  if (/password.*(length|digit|lower|uppercase|special|symbol|security)|пароль.*(символ|цифр|цифру|літер|букв|спеціальн|security)|passwordrequires/i.test(lower)) return "PASSWORD_POLICY";
  if (/optimistic concurrency failure|concurrency failure|already confirmed|already been confirmed|вже підтверджено|уже подтвержден/i.test(lower)) return "ALREADY_PROCESSED";
  if (/google_not_configured|google not configured/.test(lower)) return "GOOGLE_NOT_CONFIGURED";
  if (/google_access_denied|access denied|cancelled by user|denied/.test(lower)) return "GOOGLE_ACCESS_DENIED";
  if (/google_email_required|did not return an email/.test(lower)) return "GOOGLE_EMAIL_REQUIRED";
  if (/google_email_not_verified|not verified/.test(lower)) return "GOOGLE_EMAIL_NOT_VERIFIED";
  if (/google_login_failed|external login failed|could not finish google sign-in/.test(lower)) return "GOOGLE_LOGIN_FAILED";
  if (/google_session_not_ready|session is not ready/.test(lower)) return "GOOGLE_SESSION_NOT_READY";
  if (/invalid token|invalid link|expired|застаріле|застарілий|недійсне|недействитель|invalid.*email|скидання пароля недійсне|reset link/i.test(lower)) return "INVALID_LINK";
  if ((hasStatus && status === 0) || /network error|request timed out|request aborted|failed to fetch|load failed/i.test(lower)) return "NETWORK";

  return "UNKNOWN";
}
// Функція нижче інкапсулює окрему частину логіки цього модуля
function looksTechnical(raw) {
  if (!raw) return false;
  return /\b\d{3}\b|bad request|problem details|traceid|sql|exception|stack|optimistic concurrency|request timed out|request aborted|network error/i.test(raw);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAuthErrorMessage(input, locale = "uk", fallback = "") {
  const selectedLocale = pickLocale(locale);
  const raw = String(input?.rawError || input?.error || input?.message || "").trim();
  const code = detectAuthErrorCode(input);

  if (code !== "UNKNOWN") {
    return MESSAGES[code][selectedLocale];
  }

  if (raw && !looksTechnical(raw)) {
    return raw;
  }

  return fallback || MESSAGES.UNKNOWN[selectedLocale];
}
