

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { resendConfirmation } from "../services/authApi.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";
import { readRememberedAuthEmail, rememberAuthEmail } from "../services/authFlowStorage.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function EmailConfirmationNotice() {
  const location = useLocation();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    pendingTitle: t("auth.noticePendingTitle"),
    pendingSubtitle: t("auth.noticePendingSubtitle"),
    blockedTitle: t("auth.noticeBlockedTitle"),
    blockedSubtitle: t("auth.noticeBlockedSubtitle"),
    emailLabel: t("auth.noticeEmailLabel"),
    emailPlaceholder: t("auth.noticeEmailPlaceholder"),
    resend: t("auth.noticeResend"),
    resendBusy: t("auth.noticeResendBusy"),
    resendDone: t("auth.noticeResendDone"),
    enterEmail: t("auth.noticeEnterEmail"),
    hintTitle: t("auth.noticeHintTitle"),
    hint1: t("auth.noticeHintOpenEmail"),
    hint2: t("auth.noticeHintReturnLogin"),
    hint3: t("auth.noticeHintDevLogs"),
    devHint: t("auth.noticeDevHint"),
    login: t("auth.noticeBackLogin"),
    register: t("auth.noticeBackRegister"),
  }), [t]);
  const isPending = location.pathname.includes("/confirm-email/pending");

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState(() => String(location.state?.email || readRememberedAuthEmail() || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDevHint, setShowDevHint] = useState(() => Boolean(location.state?.deliveryHint));
  const [success, setSuccess] = useState("");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  async function handleResend(event) {
    event?.preventDefault?.();
    if (busy) return;

    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      setError(text.enterEmail);
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      rememberAuthEmail(normalizedEmail);
      const res = await resendConfirmation(normalizedEmail);
      if (!res.ok) {
        setError(getAuthErrorMessage(res, locale, text.resendDone));
        return;
      }

      setSuccess(res.data?.message || text.resendDone);
      setShowDevHint(Boolean(res.data?.deliveryHint) || showDevHint);
    } catch (err) {
      setError(getAuthErrorMessage(err, locale, text.resendDone));
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
          <h1 className="auth-title">{isPending ? text.pendingTitle : text.blockedTitle}</h1>
          <p className="auth-subtitle auth-subtitle--wide">{isPending ? text.pendingSubtitle : text.blockedSubtitle}</p>
        </div>

        <form onSubmit={handleResend}>
          <div className="auth-form-group">
            <label className="auth-label">{text.emailLabel}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                type="email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className="auth-primary-btn" disabled={busy}>
            {busy ? text.resendBusy : text.resend}
          </button>

          {error ? <div className="auth-error-box">{error}</div> : null}
          {success ? <div className="auth-info-box">{success}</div> : null}
          {showDevHint ? <div className="auth-info-box auth-info-box--muted">{text.devHint}</div> : null}
        </form>

        <div className="auth-infoList">
          <div className="auth-label auth-label--spaced">{text.hintTitle}</div>
          <ul>
            <li>{text.hint1}</li>
            <li>{text.hint2}</li>
            <li>{text.hint3}</li>
          </ul>
        </div>

        <div className="auth-actionsStack">
          <Link to="/login" className="auth-secondary-btn auth-secondary-btn--link">{text.login}</Link>
          {isPending ? <Link to="/register" className="auth-link auth-link--centered">{text.register}</Link> : null}
        </div>
      </div>
    </div>
  );
}
