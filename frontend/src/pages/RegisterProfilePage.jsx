

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authApi.js";
import { clearRegisterDraft, readRegisterDraft, readRegisterPassword } from "../services/registerDraft.js";
import { AuthFrame } from "../ui/AuthFrame.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RegisterProfilePage() {
  const navigate = useNavigate();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const draft = useMemo(() => readRegisterDraft(), []);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [displayName, setDisplayName] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await registerUser({ email: draft.email, password: readRegisterPassword(), isArtist, displayName });
    setBusy(false);
    if (!response.ok) {
      setError(response.error || "Registration failed");
      return;
    }
    clearRegisterDraft();
    navigate("/confirm-email/pending", { replace: true, state: { email: draft.email, deliveryHint: response.data?.deliveryHint } });
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AuthFrame title="Finish registration" subtitle={draft.email || "Email not chosen yet"} compact>
      <form onSubmit={handleSubmit} className="authForm">
        <label className="authField">
          <span>Display name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="tc" required />
        </label>
        <label className="checkboxRow">
          <input type="checkbox" checked={isArtist} onChange={(event) => setIsArtist(event.target.checked)} />
          <span>Register as artist</span>
        </label>
        <button type="submit" className="primaryButton primaryButton--full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        {error ? <div className="inlineMessage inlineMessage--error">{error}</div> : null}
      </form>
    </AuthFrame>
  );
}
