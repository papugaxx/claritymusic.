

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { EyeIcon, EyeOffIcon } from "../components/auth/AuthIcons.jsx";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { readRegisterDraft, readRegisterPassword, writeRegisterPassword } from "../services/registerDraft.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RegisterPassword() {
  const navigate = useNavigate();
  const { me, loading } = useAuth();
  const { t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    title: t("auth.registerStep1Title"),
    step: t("auth.registerStep1Step"),
    rules: t("auth.registerPasswordRules"),
    lower: t("auth.registerPasswordRuleLower"),
    digit: t("auth.registerPasswordRuleDigit"),
    length: t("auth.registerPasswordRuleLength"),
    back: t("common.back"),
    password: t("auth.password"),
    hidePassword: t("auth.hidePassword"),
    showPassword: t("auth.showPassword"),
    next: t("common.next"),
  }), [t]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [password, setPassword] = useState(() => String(readRegisterPassword() || ""));
  const [showPwd, setShowPwd] = useState(false);
  const email = String(readRegisterDraft().email || "").trim();

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const rules = useMemo(() => {
    const hasLowercase = /[a-zа-яіїєґ]/.test(password);
    const hasDigit = /\d/.test(password);
    const has8 = password.length >= 8;
    return { hasLowercase, hasDigit, has8 };
  }, [password]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!loading && me?.isAuthenticated) navigate("/app", { replace: true });
  }, [loading, me, navigate]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "auth");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function onNext(event) {
    event.preventDefault();
    if (!(rules.hasLowercase && rules.hasDigit && rules.has8)) return;
    writeRegisterPassword(password);
    navigate("/register/profile", { state: { hasPassword: true } });
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card--register-password">
        <div className="auth-topbar">
          <Link className="auth-back" to="/register">{text.back}</Link>
          <span />
        </div>

        <div className="auth-brand auth-brand--registerStep">
          <ClarityLogo height={70} className="clarity-logo--authSecondary" />
          <h1 className="auth-title">{text.title}</h1>
          <p className="auth-subtitle">{text.step}</p>
        </div>

        <div className="auth-stepbar"><div className="auth-stepbar__fill auth-stepbar__fill--half" /></div>

        <form onSubmit={onNext}>
          <div className="auth-form-group">
            <label className="auth-label">{text.password}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-icon-btn"
                onClick={() => setShowPwd((value) => !value)}
                aria-label={showPwd ? text.hidePassword : text.showPassword}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="auth-form-group auth-form-group--compact">
            <div className="auth-label auth-label--spaced">{text.rules}</div>
            <div className="auth-radio-group">
              <div className="auth-radio"><input type="checkbox" checked={rules.hasLowercase} readOnly /><span>{text.lower}</span></div>
              <div className="auth-radio"><input type="checkbox" checked={rules.hasDigit} readOnly /><span>{text.digit}</span></div>
              <div className="auth-radio"><input type="checkbox" checked={rules.has8} readOnly /><span>{text.length}</span></div>
            </div>
          </div>

          <button className="auth-primary-btn" type="submit">{text.next}</button>
        </form>
      </div>
    </div>
  );
}
