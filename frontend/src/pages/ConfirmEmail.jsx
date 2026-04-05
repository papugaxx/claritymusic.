

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { confirmEmail } from "../services/authApi.js";
import { clearAuthFlow } from "../services/authFlowStorage.js";
import { getAuthErrorMessage, detectAuthErrorCode } from "../services/authFeedback.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    loadingTitle: t("auth.confirmLoadingTitle"),
    loadingSubtitle: t("auth.confirmLoadingSubtitle"),
    successTitle: t("auth.confirmSuccessTitle"),
    successSubtitle: t("auth.confirmSuccessSubtitle"),
    alreadyConfirmedTitle: t("auth.confirmAlreadyTitle"),
    alreadyConfirmedSubtitle: t("auth.confirmAlreadySubtitle"),
    errorTitle: t("auth.confirmErrorTitle"),
    login: t("auth.confirmBackLogin"),
    resend: t("auth.confirmResend"),
    invalidLink: t("auth.confirmInvalidLink"),
    loadingState: t("auth.confirmLoadingState"),
    successState: t("auth.confirmSuccessState"),
    alreadyConfirmedState: t("auth.confirmAlreadyState"),
  }), [t]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [state, setState] = useState({ status: "loading", message: "" });

  const userId = String(searchParams.get("userId") || "").trim();
  const token = String(searchParams.get("token") || "").trim();

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!userId || !token) {
        if (!cancelled) {
          setState({ status: "error", message: text.invalidLink });
        }
        return;
      }

      try {
        const res = await confirmEmail({ userId, token });
        if (cancelled) return;

        const payload = res?.data ?? res;
        const requestFailed = res?.ok === false || payload?.ok === false;

        if (requestFailed) {
          const errorCode = detectAuthErrorCode(payload || res);

          if (errorCode === "ALREADY_PROCESSED") {
            clearAuthFlow();
            setState({
              status: "already-confirmed",
              message: payload?.message || text.alreadyConfirmedState,
            });
            return;
          }

          setState({
            status: "error",
            message: getAuthErrorMessage(payload || res, locale, text.invalidLink),
          });
          return;
        }

        clearAuthFlow();
        setState({
          status: payload?.alreadyConfirmed ? "already-confirmed" : "success",
          message: payload?.message || (payload?.alreadyConfirmed ? text.alreadyConfirmedState : text.successState),
        });
      } catch (err) {
        if (cancelled) return;

        const errorCode = detectAuthErrorCode(err);

        if (errorCode === "ALREADY_PROCESSED") {
          clearAuthFlow();
          setState({
            status: "already-confirmed",
            message: text.alreadyConfirmedState,
          });
          return;
        }

        setState({
          status: "error",
          message: getAuthErrorMessage(err, locale, text.invalidLink),
        });
      }
    }

    setState({ status: "loading", message: "" });
    run();

    return () => {
      cancelled = true;
    };
  }, [locale, text.alreadyConfirmedState, text.invalidLink, text.successState, token, userId]);

  const title =
    state.status === "success"
      ? text.successTitle
      : state.status === "already-confirmed"
        ? text.alreadyConfirmedTitle
        : state.status === "error"
          ? text.errorTitle
          : text.loadingTitle;

  const subtitle =
    state.status === "success"
      ? text.successSubtitle
      : state.status === "already-confirmed"
        ? text.alreadyConfirmedSubtitle
        : state.status === "error"
          ? state.message || text.invalidLink
          : text.loadingSubtitle;

  const infoMessage =
    state.status === "loading"
      ? text.loadingState
      : state.status === "success"
        ? state.message || text.successState
        : state.status === "already-confirmed"
          ? state.message || text.alreadyConfirmedState
          : "";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card--status">
        <div className="brand-block brand-block--register brand-block--compact">
          <ClarityLogo height={72} className="clarity-logo--authMain" />
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle auth-subtitle--wide">{subtitle}</p>
        </div>

        {state.status === "loading" ? <div className="auth-info-box">{infoMessage}</div> : null}
        {state.status === "error" ? <div className="auth-error-box">{state.message || text.invalidLink}</div> : null}
        {(state.status === "success" || state.status === "already-confirmed") ? (
          <div className="auth-info-box">{infoMessage}</div>
        ) : null}

        <div className="auth-actionsStack">
          <Link to="/login" className="auth-primary-btn auth-primary-btn--link">{text.login}</Link>
          <Link to="/email-not-confirmed" className="auth-link auth-link--centered">{text.resend}</Link>
        </div>
      </div>
    </div>
  );
}
