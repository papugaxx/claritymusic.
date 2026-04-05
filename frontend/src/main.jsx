

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import { PlayerProvider } from "./context/PlayerContext.jsx";
import I18nProvider from "./i18n/I18nProvider.jsx";
import ThemeProvider from "./theme/ThemeProvider.jsx";
import router from "./app/router.jsx";

import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppStateProvider>
            <PlayerProvider>
              <RouterProvider router={router} />
            </PlayerProvider>
          </AppStateProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
