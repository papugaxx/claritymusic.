

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { rememberAuthEmail } from "../services/authFlowStorage.js";
import { startGoogleAuth } from "../services/authApi.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { me, loading, login } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    if (!loading && me?.isAuthenticated) navigate("/app", { replace: true });
  }, [loading, me, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await login(email, password);
    if (response.ok) {
      navigate(location.state?.from || "/app", { replace: true });
    } else if (response.data?.requiresEmailConfirmation) {
      rememberAuthEmail(email);
      navigate("/email-not-confirmed", { state: { email, deliveryHint: response.data?.deliveryHint } });
    } else {
      setError(response.error || "Login failed");
    }
    setBusy(false);
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame brandTagline="MUSIC WITHOUT LIMITS" compact>
      <form onSubmit={handleSubmit} className="authForm">
        <label className="authField">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tc10762@gmail.com" required autoComplete="email" />
        </label>

        <label className="authField">
          <span>Password</span>
          <div className="authField__passwordWrap">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            <button type="button" className="iconButton iconButton--ghost authField__toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "🙈" : "👁"}</button>
          </div>
        </label>

        <div className="authInline">
          <span />
          <Link to="/forgot-password">Забули пароль?</Link>
        </div>

        <button type="submit" className="primaryButton primaryButton--full" disabled={busy}>{busy ? "Log in…" : "Log in"}</button>
        {error ? <div className="inlineMessage inlineMessage--error">{error}</div> : null}
      </form>

      <div className="authDivider">or</div>
      <button type="button" className="secondaryButton secondaryButton--full" onClick={() => startGoogleAuth("/app")}>Continue with Google</button>

      <div className="authFooter authFooter--inline">No account yet? <Link to="/register">Register in CLARITY.music</Link></div>
    </AuthFrame>
  );
}
