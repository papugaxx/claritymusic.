

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmEmail } from "../services/authApi.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [status, setStatus] = useState("Confirming email…");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    confirmEmail({ userId: params.get("userId"), token: params.get("token") }).then((response) => {
      if (!alive) return;
      setStatus(response.ok ? "Email confirmed. Redirecting to login…" : (response.error || "Failed to confirm email"));
      if (response.ok) {
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    });
    return () => {
      alive = false;
    };
  }, [navigate, params]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Confirm your email" subtitle="We are finishing the last account step." compact>
      <div className="inlineMessage">{status}</div>
      <div className="authFooter authFooter--inline"><Link to="/login">Back to sign in</Link></div>
    </AuthFrame>
  );
}
