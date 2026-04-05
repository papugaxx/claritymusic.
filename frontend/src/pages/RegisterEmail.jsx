

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { GoogleIcon } from "../components/auth/AuthIcons.jsx";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { readRegisterDraft, writeRegisterDraft } from "../services/registerDraft.js";
import { startGoogleAuth } from "../services/authApi.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RegisterEmail() {
  const navigate = useNavigate();
  const { me, loading } = useAuth();
  const { t } = useI18n();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState(() => String(readRegisterDraft().email || ""));
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

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function onNext(event) {
    event.preventDefault();
    const nextEmail = String(email || "").trim();
    if (!nextEmail) return;
    writeRegisterDraft({ email: nextEmail });
    navigate("/register/password");
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
      <div className="auth-card auth-card--register-email">
        <div className="brand-block brand-block--register">
          <ClarityLogo height={76} className="clarity-logo--authMain" />
          <p className="brand-subtitle">{t("auth.subtitle").toUpperCase()}</p>
        </div>

        <form onSubmit={onNext}>
          <div className="auth-form-group">
            <label className="auth-label">{t("auth.email")}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@gmail.com"
                type="email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button className="auth-primary-btn" type="submit">{t("common.next")}</button>
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
          <span>{t("auth.haveAccount")}</span>
          <Link to="/login" className="auth-link">{t("auth.loginIntoIt")}</Link>
        </div>
      </div>
    </div>
  );
}
