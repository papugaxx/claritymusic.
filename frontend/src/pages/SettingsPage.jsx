

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getCurrentUser } from "../services/authApi.js";
import { Field } from "../ui/Field.jsx";
import { Surface } from "../ui/Surface.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useShell } from "../contexts/ShellContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, setLanguage, themePreset, setThemePreset } = useShell();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [me, setMe] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    getCurrentUser().then((response) => {
      if (!alive) return;
      setMe(response.ok ? response.data : null);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleChangePassword() {
    setBusy(true);
    const response = await changePassword({ currentPassword, newPassword, confirmNewPassword: confirmPassword });
    setBusy(false);
    setMessage(response.ok ? "Password updated." : (response.error || "Failed to update password"));
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="settingsHero">
        <div>
          <span className="badge badge--plain">SETTINGS</span>
          <h1>Settings</h1>
          <p>Choose a preset theme and language. Your original classic theme stays the default.</p>
        </div>
      </Surface>

      <div className="settingsGrid">
        <Surface className="profileSection">
          <h3>Account</h3>
          <p>Session controls and quick access to your profile.</p>
          <div className="buttonRow">
            <button type="button" className="ghostButton" onClick={() => navigate("/app/me")}>My profile</button>
            <button type="button" className="ghostButton" onClick={async () => { await logout(); navigate("/login", { replace: true }); }}>Log out</button>
          </div>
        </Surface>

        <Surface className="profileSection">
          <h3>Interface language</h3>
          <p>Choose the app language. Your selection is saved between sessions.</p>
          <div className="chipRow">
            <button type="button" className={`ghostButton ${language === "uk" ? "is-selected" : ""}`.trim()} onClick={() => setLanguage("uk")}>Українська</button>
            <button type="button" className={`ghostButton ${language === "ru" ? "is-selected" : ""}`.trim()} onClick={() => setLanguage("ru")}>Русский</button>
            <button type="button" className={`ghostButton ${language === "en" ? "is-selected" : ""}`.trim()} onClick={() => setLanguage("en")}>English</button>
          </div>
        </Surface>

        <Surface className="profileSection settingsSection--wide">
          <h3>Account access</h3>
          <p>Your account email and current confirmation status.</p>
          <div className="settingsAccessRow">
            <div>
              <div className="settingsAccessRow__label">Email</div>
              <strong>{me?.email || "—"}</strong>
            </div>
            <div className={`statusPill ${me?.emailConfirmed ? "is-positive" : ""}`.trim()}>{me?.emailConfirmed ? "Confirmed" : "Pending"}</div>
          </div>
        </Surface>

        <Surface className="profileSection settingsSection--wide">
          <h3>Change password</h3>
          <p>Use this form when you still know the current password and just want to update it inside the account.</p>
          <div className="splitFields">
            <Field label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <Field label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>
          <Field label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          <button type="button" className="ghostButton" onClick={handleChangePassword} disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
          <p className="mutedText">If you do not remember the current password, use the recovery flow from the sign-in page.</p>
          {message ? <div className="inlineMessage">{message}</div> : null}
        </Surface>

        <Surface className="profileSection settingsSection--wide">
          <h3>App theme</h3>
          <p>Changing the theme affects the header, sidebars, cards, player and pages.</p>
          <div className="themeCards">
            <button type="button" className={`themeCard ${themePreset === "dark" ? "is-active" : ""}`.trim()} onClick={() => setThemePreset("dark")}>
              <span className="themeCard__preview themeCard__preview--dark" />
              <span className="themeCard__copy">
                <span className="themeCard__chips"><span className="miniChip">DARK THEME</span>{themePreset === "dark" ? <span className="miniChip">ACTIVE</span> : null}</span>
                <strong>Violet night</strong>
                <span>A rich dark interface with vivid lavender accents.</span>
              </span>
            </button>
            <button type="button" className={`themeCard ${themePreset === "light" ? "is-active" : ""}`.trim()} onClick={() => setThemePreset("light")}>
              <span className="themeCard__preview themeCard__preview--light" />
              <span className="themeCard__copy">
                <span className="themeCard__chips"><span className="miniChip">LIGHT THEME</span>{themePreset === "light" ? <span className="miniChip">ACTIVE</span> : null}</span>
                <strong>Soft light</strong>
                <span>Light lavender surfaces with neat purple gradients.</span>
              </span>
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
