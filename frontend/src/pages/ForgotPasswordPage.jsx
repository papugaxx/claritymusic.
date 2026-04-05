

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authApi.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ForgotPasswordPage() {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    const response = await forgotPassword(email);
    setBusy(false);
    setMessage(response.data?.message || response.error || "Done");
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Recover your password" subtitle="Enter the email linked to your account." compact>
      <form className="authForm" onSubmit={handleSubmit}>
        <label className="authField">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit" className="primaryButton primaryButton--full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        {message ? <div className="inlineMessage">{message}</div> : null}
      </form>
      <div className="authFooter authFooter--inline"><Link to="/login">Back to sign in</Link></div>
    </AuthFrame>
  );
}
