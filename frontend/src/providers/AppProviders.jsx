

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { ShellProvider } from "../contexts/ShellContext.jsx";
import { PlayerProvider } from "../contexts/PlayerContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AppProviders({ children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthProvider>
      <ShellProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </ShellProvider>
    </AuthProvider>
  );
}
