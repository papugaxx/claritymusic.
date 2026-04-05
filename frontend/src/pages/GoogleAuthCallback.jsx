

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { getAuthErrorMessage } from "../services/authFeedback.js";
import { useI18n } from "../i18n/I18nProvider.jsx";


// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeReturnUrl(value) {
  const trimmed = String(value || "").trim();
  return trimmed.startsWith("/") ? trimmed : "/app";
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    loadingTitle: t("auth.googleLoadingTitle"),
    loadingSubtitle: t("auth.googleLoadingSubtitle"),
    loadingState: t("auth.googleLoadingState"),
    errorTitle: t("auth.googleErrorTitle"),
    login: t("auth.googleBackLogin"),
    register: t("auth.googleBackRegister"),
    fallbackError: t("auth.googleFallbackError"),
    sessionMissing: t("auth.googleSessionMissing"),
  }), [t]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [state, setState] = useState({ status: "loading", message: "" });

  const status = String(searchParams.get("status") || "").trim().toLowerCase();
  const returnUrl = normalizeReturnUrl(searchParams.get("returnUrl"));
  const errorCode = String(searchParams.get("errorCode") || "").trim();
  const errorMessage = String(searchParams.get("errorMessage") || "").trim();

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let cancelled = false;

    
    async function finalizeGoogleLogin() {
      if (status !== "success") {
        if (!cancelled) {
          setState({
            status: "error",
            message: getAuthErrorMessage({ error: errorCode, message: errorMessage }, locale, text.fallbackError),
          });
        }
        return;
      }

      if (!cancelled) {
        setState({ status: "loading", message: text.loadingState });
      }

      try {
        const me = await refreshMe();
        if (cancelled) return;

        if (me?.isAuthenticated) {
          navigate(returnUrl, { replace: true });
          return;
        }

        setState({
          status: "error",
          message: getAuthErrorMessage({ error: "GOOGLE_SESSION_NOT_READY", message: text.sessionMissing }, locale, text.sessionMissing),
        });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: getAuthErrorMessage(err, locale, text.fallbackError),
          });
        }
      }
    }

    finalizeGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, [errorCode, errorMessage, locale, navigate, refreshMe, returnUrl, status, text.fallbackError, text.loadingState, text.sessionMissing]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card--status">
        <div className="brand-block brand-block--register brand-block--compact">
          <ClarityLogo height={72} className="clarity-logo--authMain" />
          <h1 className="auth-title">{state.status === "loading" ? text.loadingTitle : text.errorTitle}</h1>
          <p className="auth-subtitle auth-subtitle--wide">{state.status === "loading" ? text.loadingSubtitle : state.message}</p>
        </div>

        {state.status === "loading" ? <div className="auth-info-box">{state.message || text.loadingState}</div> : null}
        {state.status === "error" ? <div className="auth-error-box">{state.message || text.fallbackError}</div> : null}

        <div className="auth-actionsStack">
          <Link to="/login" className="auth-primary-btn auth-primary-btn--link">{text.login}</Link>
          <Link to="/register" className="auth-link auth-link--centered">{text.register}</Link>
        </div>
      </div>
    </div>
  );
}
