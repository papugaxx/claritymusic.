

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authApi.js";
import { useAuth } from "../hooks/useAuth.jsx";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { clearRegisterDraft, readRegisterDraft, readRegisterPassword, writeRegisterDraft } from "../services/registerDraft.js";
import { rememberAuthEmail } from "../services/authFlowStorage.js";
import { getAuthErrorMessage } from "../services/authFeedback.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RegisterProfile() {
  const navigate = useNavigate();
  const { me, loading } = useAuth();
  const { locale, t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    title: t("auth.registerStep2Title"),
    step: t("auth.registerStep2Step"),
    name: t("auth.registerDisplayNameLabel"),
    namePlaceholder: t("auth.registerDisplayNamePlaceholder"),
    role: t("auth.registerRoleLabel"),
    user: t("auth.registerRoleListener"),
    artist: t("auth.registerRoleArtist"),
    busy: t("auth.registerBusy"),
    submit: t("auth.registerSubmit"),
    registerFailed: t("auth.registerFailed"),
    back: t("common.back"),
    haveAccount: t("auth.haveAccount"),
    loginIntoIt: t("auth.loginIntoIt"),
  }), [t]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [registerSnapshot] = useState(() => {
    const draft = readRegisterDraft();
    return {
      draft,
      email: String(draft.email || "").trim(),
      password: String(readRegisterPassword() || ""),
    };
  });
  const email = registerSnapshot.email;
  const password = registerSnapshot.password;

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(() => String(registerSnapshot.draft?.name || ""));
  const [role, setRole] = useState(() => String(registerSnapshot.draft?.role || "user"));

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
    if (!email) {
      navigate("/register", { replace: true });
      return;
    }

    if (!password) {
      navigate("/register/password", { replace: true });
    }
  }, [email, password, navigate]);

  
  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const displayName = String(name || "").trim() || null;
      const isArtist = role === "artist";
      writeRegisterDraft({ name: displayName || "", role });
      const res = await registerUser({ email, password, isArtist, displayName });
      if (!res.ok) {
        setError(getAuthErrorMessage(res, locale, text.registerFailed));
        return;
      }

      clearRegisterDraft();
      rememberAuthEmail(email);
      navigate("/confirm-email/pending", {
        replace: true,
        state: {
          email,
          deliveryHint: res.data?.deliveryHint || "",
        },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err, locale, text.registerFailed));
    } finally {
      setBusy(false);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card--register-profile">
        <div className="auth-topbar">
          <button className="auth-back" type="button" onClick={() => navigate("/register/password")}>{text.back}</button>
          <span />
        </div>

        <div className="auth-brand auth-brand--registerStep">
          <ClarityLogo height={70} className="clarity-logo--authSecondary" />
          <h1 className="auth-title">{text.title}</h1>
          <p className="auth-subtitle">{text.step}</p>
        </div>

        <div className="auth-stepbar"><div className="auth-stepbar__fill" /></div>

        <form onSubmit={onSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">{text.name}</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={text.namePlaceholder}
                maxLength={80}
                autoComplete="nickname"
              />
            </div>
          </div>

          <div className="auth-form-group auth-form-group--compact">
            <div className="auth-label auth-label--spaced">{text.role}</div>
            <div className="auth-radio-group">
              <label className="auth-radio"><input type="radio" name="role" value="user" checked={role === "user"} onChange={(event) => setRole(event.target.value)} /><span>{text.user}</span></label>
              <label className="auth-radio"><input type="radio" name="role" value="artist" checked={role === "artist"} onChange={(event) => setRole(event.target.value)} /><span>{text.artist}</span></label>
            </div>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="auth-primary-btn" type="submit" disabled={busy}>
            {busy ? text.busy : text.submit}
          </button>
        </form>

        <div className="auth-footer">
          <span>{text.haveAccount}</span>
          <Link to="/login" className="auth-link">{text.loginIntoIt}</Link>
        </div>
      </div>
    </div>
  );
}
