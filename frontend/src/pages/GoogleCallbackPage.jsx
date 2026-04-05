

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    const success = params.get("success");
    const returnUrl = params.get("returnUrl") || "/app";
    navigate(success === "true" ? returnUrl : "/login", { replace: true });
  }, [navigate, params]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Completing Google sign-in" subtitle="Please wait a moment." compact>
      <div className="inlineMessage">Completing Google sign-in…</div>
    </AuthFrame>
  );
}
