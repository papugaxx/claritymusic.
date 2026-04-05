

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { writeRegisterDraft } from "../services/registerDraft.js";
import { startGoogleAuth } from "../services/authApi.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RegisterEmailPage() {
  const navigate = useNavigate();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [email, setEmail] = useState("");

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame brandTagline="MUSIC WITHOUT LIMITS" compact>
      <form className="authForm" onSubmit={(event) => { event.preventDefault(); writeRegisterDraft({ email }); navigate("/register/password"); }}>
        <label className="authField">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" required autoComplete="email" />
        </label>
        <button type="submit" className="primaryButton primaryButton--full">Next</button>
      </form>

      <div className="authDivider">or</div>
      <button type="button" className="secondaryButton secondaryButton--full" onClick={() => startGoogleAuth("/app")}>Continue with Google</button>
      <div className="authFooter authFooter--inline">Already have an account? <Link to="/login">Log into it</Link></div>
    </AuthFrame>
  );
}
