

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function EmailNoticePage() {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const deliveryHint = location.state?.deliveryHint || "";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Check your email" subtitle="Your account is almost ready." compact>
      <div className="inlineMessage">A confirmation link was prepared for <strong>{email}</strong>. {deliveryHint}</div>
      <div className="authInfoList">
        <div>What to do next</div>
        <ul>
          <li>Open the email and follow the confirmation link.</li>
          <li>Return to the sign-in page after confirming.</li>
          <li>In development mode, the backend logs may contain the direct link.</li>
        </ul>
      </div>
      <div className="authFooter authFooter--stack">
        <Link to="/login">Back to sign in</Link>
        <Link to="/register">Back to registration</Link>
      </div>
    </AuthFrame>
  );
}
