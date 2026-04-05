

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link } from "react-router-dom";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function NotFoundPage() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Page not found" subtitle="The requested route does not exist." compact>
      <div className="authFooter authFooter--inline"><Link to="/app">Go back to app</Link></div>
    </AuthFrame>
  );
}
