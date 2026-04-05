

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "../components/auth/AuthIcons.jsx";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { rememberAuthEmail } from "../services/authFlowStorage.js";
import { startGoogleAuth } from "../services/authApi.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";

const APP_NAME = "CLARITY.music";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Login() {
  const navigate = useNavigate();
  const { me, loading, login } = useAuth();
  const { t, locale } = useI18n();

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!loading && me?.isAuthenticated) navigate("/app", { replace: true });
  }, [loading, me, navigate]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  
  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const res = await login(email, password);
      if (res?.ok) {
        navigate("/app", { replace: true });
        return;
      }

      if (res?.data?.requiresEmailConfirmation) {
        rememberAuthEmail(res?.data?.email || email);
        navigate("/email-not-confirmed", {
          replace: true,
          state: {
            email: res?.data?.email || email,
            deliveryHint: res?.data?.deliveryHint || "",
          },
        });
        return;
      }

      setError(getAuthErrorMessage(res, locale, t("auth.loginError")));
    } catch (err) {
      setError(getAuthErrorMessage(err, locale, t("auth.loginError")));
    } finally {
      setBusy(false);
    }
  }

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function handleGoogleClick() {
    if (googleBusy) return;
    setGoogleBusy(true);
    startGoogleAuth("/app");
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="brand-block brand-block--login">
          <ClarityLogo height={76} className="clarity-logo--authMain" />
          <p className="brand-subtitle">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">{t("auth.email")}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clarity.music"
                type="email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">{t("auth.password")}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="auth-input-icon-btn"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="auth-inline-row">
            <span />
            <Link
              to={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : "/forgot-password"}
              className="auth-link"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <button type="submit" disabled={busy} className="auth-primary-btn">
            {busy ? t("auth.loginBusy") : t("auth.login")}
          </button>

          {error ? <div className="auth-error-box">{error}</div> : null}
        </form>

        <div className="auth-divider">{t("common.or")}</div>

        <button
          className="auth-social-btn"
          type="button"
          onClick={handleGoogleClick}
          disabled={googleBusy}
          title={t("auth.loginWithGoogle")}
        >
          <GoogleIcon />
          {googleBusy ? t("auth.googleRedirectBusy") : t("auth.loginWithGoogle")}
        </button>

        <div className="auth-footer">
          <span>{t("auth.noAccount")}</span>
          <Link to="/register" className="auth-link">
            {t("auth.registerInApp").replace("CLARITY.music", APP_NAME)}
          </Link>
        </div>
      </div>
    </div>
  );
}
