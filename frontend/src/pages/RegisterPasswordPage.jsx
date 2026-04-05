

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readRegisterDraft, writeRegisterPassword } from "../services/registerDraft.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RegisterPasswordPage() {
  const navigate = useNavigate();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const draft = useMemo(() => readRegisterDraft(), []);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const valid = /[a-z]/.test(password) && /\d/.test(password) && password.length >= 8;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Create your profile" subtitle={draft.email || "Email not chosen yet"} compact>
      <form className="authForm" onSubmit={(event) => { event.preventDefault(); if (!valid) return; writeRegisterPassword(password); navigate("/register/profile"); }}>
        <label className="authField">
          <span>Password</span>
          <div className="authField__passwordWrap">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required autoComplete="new-password" />
            <button type="button" className="iconButton iconButton--ghost authField__toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "🙈" : "👁"}</button>
          </div>
        </label>

        <div className="hintList">
          <span className={/[a-z]/.test(password) ? "is-ok" : ""}>1 lowercase letter</span>
          <span className={/\d/.test(password) ? "is-ok" : ""}>1 number</span>
          <span className={password.length >= 8 ? "is-ok" : ""}>8 characters</span>
        </div>

        <button type="submit" className="primaryButton primaryButton--full" disabled={!valid}>Next</button>
      </form>
    </AuthFrame>
  );
}
