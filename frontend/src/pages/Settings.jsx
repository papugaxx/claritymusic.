

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { changePassword } from "../services/authApi.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function ThemePreview({ themeId }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={`settings-themeCard__preview settings-themeCard__preview--${themeId}`} aria-hidden="true">
      <div className="settings-themeCard__previewShell">
        <span className="settings-themeCard__previewSidebar">
          <span className="settings-themeCard__previewSidebarDot" />
          <span className="settings-themeCard__previewSidebarDot" />
          <span className="settings-themeCard__previewSidebarLine" />
          <span className="settings-themeCard__previewSidebarLine settings-themeCard__previewSidebarLine--short" />
        </span>

        <span className="settings-themeCard__previewCanvas">
          <span className="settings-themeCard__previewHero" />
          <span className="settings-themeCard__previewRow" />
          <span className="settings-themeCard__previewRow settings-themeCard__previewRow--short" />
          <span className="settings-themeCard__previewPlayer">
            <span className="settings-themeCard__previewPlayerTrack" />
          </span>
        </span>

        <span className="settings-themeCard__previewThumb" />
      </div>
    </div>
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Settings() {
  const navigate = useNavigate();
  const { me, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { themeId, setThemeId } = useTheme();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const accountText = useMemo(() => ({
    accessTitle: t("settings.accessTitle"),
    accessSub: t("settings.accessSub"),
    email: t("settings.accountEmail"),
    emailConfirmed: t("settings.emailConfirmed"),
    emailPending: t("settings.emailPending"),
    passwordTitle: t("settings.passwordTitle"),
    passwordSub: t("settings.passwordSub"),
    passwordHelp: t("settings.passwordHelp"),
    currentPassword: t("settings.currentPassword"),
    newPassword: t("settings.newPassword"),
    confirmPassword: t("settings.confirmPassword"),
    savePassword: t("settings.savePassword"),
    savingPassword: t("settings.savingPassword"),
    passwordSuccess: t("settings.passwordSuccess"),
    passwordError: t("settings.passwordError"),
    passwordMismatch: t("settings.passwordMismatch"),
  }), [t]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const presets = useMemo(
    () => [
      {
        id: "violet",
        title: t("settings.themeVioletTitle"),
        label: t("settings.darkTheme"),
        note: t("settings.themeVioletNote"),
        swatches: ["#1b1330", "#6d45c6", "#efe6ff"],
      },
      {
        id: "light",
        title: t("settings.themeLightTitle"),
        label: t("settings.lightTheme"),
        note: t("settings.themeLightNote"),
        swatches: ["#f6f0ff", "#ccb6ff", "#5a4188"],
      },
    ],
    [t]
  );

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const localeOptions = useMemo(
    () => [
      { value: "uk", label: t("settings.localeUk") },
      { value: "ru", label: t("settings.localeRu") },
      { value: "en", label: t("settings.localeEn") },
    ],
    [t]
  );

  async function handleChangePassword(event) {
    event.preventDefault();
    if (passwordBusy) return;

    if (newPassword !== confirmPassword) {
      setPasswordError(accountText.passwordMismatch);
      setPasswordSuccess("");
      return;
    }

    setPasswordBusy(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (!res.ok) {
        setPasswordError(getAuthErrorMessage(res, locale, accountText.passwordError));
        return;
      }

      setPasswordSuccess(res.data?.message || accountText.passwordSuccess);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(getAuthErrorMessage(err, locale, accountText.passwordError));
    } finally {
      setPasswordBusy(false);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <section className="settings-pageShell">
      <div className="settings-card">
        <div className="settings-head">
          <div className="settings-kicker">{t("settings.title")}</div>
          <h1>{t("settings.title")}</h1>
          <p className="settings-subtitle">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="settings-grid settings-grid--top">
          <section className="settings-panel">
            <div className="settings-panel__head">
              <h2>{t("settings.account")}</h2>
              <p>{t("settings.accountSub")}</p>
            </div>

            <div className="settings-actionsRow">
              <button type="button" className="settings-chipBtn" onClick={() => navigate("/app/me")}>
                {t("settings.myProfile")}
              </button>
              <button
                type="button"
                className="settings-chipBtn"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
              >
                {t("auth.logout")}
              </button>
            </div>
          </section>

          <section className="settings-panel">
            <div className="settings-panel__head">
              <h2>{t("settings.language")}</h2>
              <p>{t("settings.languageSub")}</p>
            </div>

            <div className="settings-actionsRow settings-actionsRow--wrap">
              {localeOptions.map((option) => {
                const isActive = locale === option.value;
                // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`settings-chipBtn${isActive ? " is-active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => setLocale(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="settings-panel settings-panel--full settings-accountPanel">
          <div className="settings-panel__head">
            <h2>{accountText.accessTitle}</h2>
            <p>{accountText.accessSub}</p>
          </div>

          <div className="settings-accountList">
            <div className="settings-accountRow">
              <span className="settings-accountRow__label">{accountText.email}</span>
              <div className="settings-accountRow__valueWrap">
                <span className="settings-accountRow__value">{me?.email || "—"}</span>
                <span className={`settings-statusBadge${me?.emailConfirmed ? " is-confirmed" : " is-pending"}`}>
                  {me?.emailConfirmed ? accountText.emailConfirmed : accountText.emailPending}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-panel settings-panel--full settings-accountPanel">
          <div className="settings-panel__head">
            <h2>{accountText.passwordTitle}</h2>
            <p>{accountText.passwordSub}</p>
          </div>

          <form className="settings-formGrid" onSubmit={handleChangePassword}>
            <label className="settings-field">
              <span className="settings-field__label">{accountText.currentPassword}</span>
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label className="settings-field">
              <span className="settings-field__label">{accountText.newPassword}</span>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="settings-field settings-field--full">
              <span className="settings-field__label">{accountText.confirmPassword}</span>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <div className="settings-formActions">
              <button type="submit" className="btn primary" disabled={passwordBusy}>
                {passwordBusy ? accountText.savingPassword : accountText.savePassword}
              </button>
            </div>

            <div className="settings-formHint">{accountText.passwordHelp}</div>
            {passwordError ? <div className="settings-formMessage settings-formMessage--error">{passwordError}</div> : null}
            {passwordSuccess ? <div className="settings-formMessage settings-formMessage--success">{passwordSuccess}</div> : null}
          </form>
        </section>

        <section className="settings-panel settings-panel--full settings-themeSection">
          <div className="settings-panel__head">
            <h2>{t("settings.appTheme")}</h2>
            <p>{t("settings.appThemeSub")}</p>
          </div>

          <div className="settings-themeGrid">
            {presets.map((preset) => {
              const isActive = themeId === preset.id;

              // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`settings-themeCard${isActive ? " is-active" : ""}`}
                  onClick={() => setThemeId(preset.id)}
                  aria-pressed={isActive}
                >
                  <ThemePreview themeId={preset.id} />

                  <div className="settings-themeCard__meta">
                    <div className="settings-themeCard__eyebrowRow">
                      <span className="settings-themeCard__eyebrow">{preset.label}</span>
                      {isActive ? <span className="settings-themeCard__status">{t("settings.active")}</span> : null}
                    </div>

                    <div className="settings-themeCard__title">{preset.title}</div>
                    <div className="settings-themeCard__note">{preset.note}</div>

                    <div className="settings-themeCard__swatches" aria-hidden="true">
                      {preset.swatches.map((swatch) => (
                        <span
                          key={swatch}
                          className="settings-themeCard__swatch"
                          style={{ background: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
