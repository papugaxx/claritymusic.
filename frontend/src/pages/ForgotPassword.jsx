

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { forgotPassword } from "../services/authApi.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";
import { rememberAuthEmail } from "../services/authFlowStorage.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    title: t("auth.forgotTitle"),
    subtitle: t("auth.forgotSubtitle"),
    email: t("auth.forgotEmailLabel"),
    placeholder: t("auth.forgotEmailPlaceholder"),
    submit: t("auth.forgotSubmit"),
    submitting: t("auth.forgotSubmitting"),
    success: t("auth.forgotSuccess"),
    devHint: t("auth.forgotDevHint"),
    login: t("auth.forgotBackLogin"),
  }), [t]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState(() => String(searchParams.get("email") || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showDevHint, setShowDevHint] = useState(false);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) return;

    setBusy(true);
    setError("");
    setInfo("");

    try {
      rememberAuthEmail(normalizedEmail);
      const res = await forgotPassword(normalizedEmail);
      if (!res.ok) {
        setError(getAuthErrorMessage(res, locale, text.success));
        return;
      }

      setInfo(res.data?.message || text.success);
      setShowDevHint(Boolean(res.data?.deliveryHint));
    } catch (err) {
      setError(getAuthErrorMessage(err, locale, text.success));
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

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">{text.email}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.placeholder}
                type="email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className="auth-primary-btn" disabled={busy}>
            {busy ? text.submitting : text.submit}
          </button>

          {error ? <div className="auth-error-box">{error}</div> : null}
          {info ? <div className="auth-info-box">{info}</div> : null}
          {showDevHint ? <div className="auth-info-box auth-info-box--muted">{text.devHint}</div> : null}
        </form>

        <div className="auth-actionsStack">
          <Link to="/login" className="auth-link auth-link--centered">{text.login}</Link>
        </div>
      </div>
    </div>
  );
}
