

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authApi.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    const response = await resetPassword({
      email: params.get("email"),
      token: params.get("token"),
      newPassword: password,
      confirmNewPassword: confirm,
    });
    setBusy(false);
    setMessage(response.ok ? "Password changed." : (response.error || "Failed to reset password"));
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Set a new password" subtitle="Finish the recovery flow with a new password." compact>
      <form className="authForm" onSubmit={handleSubmit}>
        <label className="authField">
          <span>New password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" />
        </label>
        <label className="authField">
          <span>Confirm new password</span>
          <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete="new-password" />
        </label>
        <button type="submit" className="primaryButton primaryButton--full" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        {message ? <div className="inlineMessage">{message}</div> : null}
      </form>
      <div className="authFooter authFooter--inline"><Link to="/login">Back to sign in</Link></div>
    </AuthFrame>
  );
}
