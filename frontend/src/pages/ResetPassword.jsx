

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "../components/auth/AuthIcons.jsx";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { resetPassword } from "../services/authApi.js";
import { clearAuthFlow } from "../services/authFlowStorage.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    title: t("auth.resetTitle"),
    subtitle: t("auth.resetSubtitle"),
    password: t("auth.resetPasswordLabel"),
    confirmPassword: t("auth.resetConfirmPasswordLabel"),
    submit: t("auth.resetSubmit"),
    submitting: t("auth.resetSubmitting"),
    success: t("auth.resetSuccess"),
    invalidLink: t("auth.resetInvalidLink"),
    mismatch: t("auth.resetMismatch"),
    login: t("auth.resetBackLogin"),
    requestAnother: t("auth.resetRequestAnother"),
    showPassword: t("auth.showPassword"),
    hidePassword: t("auth.hidePassword"),
  }), [t]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [password, setPassword] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const email = String(searchParams.get("email") || "").trim();
  const token = String(searchParams.get("token") || "").trim();
  const hasValidLink = Boolean(email && token);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || !hasValidLink) return;

    if (password !== confirmPasswordValue) {
      setError(text.mismatch);
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await resetPassword({
        email,
        token,
        newPassword: password,
        confirmNewPassword: confirmPasswordValue,
      });

      if (!res.ok) {
        setError(getAuthErrorMessage(res, locale, text.invalidLink));
        return;
      }

      clearAuthFlow();
      setSuccess(res.data?.message || text.success);
      setPassword("");
      setConfirmPasswordValue("");
    } catch (err) {
      setError(getAuthErrorMessage(err, locale, text.invalidLink));
    } finally {
      setBusy(false);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card--status">
        <div className="brand-block brand-block--register brand-block--compact">
          <ClarityLogo height={72} className="clarity-logo--authMain" />
          <h1 className="auth-title">{text.title}</h1>
          <p className="auth-subtitle auth-subtitle--wide">{text.subtitle}</p>
        </div>

        {!hasValidLink ? <div className="auth-error-box">{text.invalidLink}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">{text.password}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!hasValidLink}
              />
              <button
                type="button"
                className="auth-input-icon-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? text.hidePassword : text.showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">{text.confirmPassword}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPasswordValue}
                onChange={(event) => setConfirmPasswordValue(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!hasValidLink}
              />
              <button
                type="button"
                className="auth-input-icon-btn"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? text.hidePassword : text.showPassword}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-primary-btn" disabled={busy || !hasValidLink}>
            {busy ? text.submitting : text.submit}
          </button>

          {error ? <div className="auth-error-box">{error}</div> : null}
          {success ? <div className="auth-info-box">{success}</div> : null}
        </form>

        <div className="auth-actionsStack">
          <Link to="/login" className="auth-primary-btn auth-primary-btn--link">{text.login}</Link>
          <Link to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"} className="auth-link auth-link--centered">
            {text.requestAnother}
          </Link>
        </div>
      </div>
    </div>
  );
}
