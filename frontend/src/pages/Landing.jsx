

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function Note({ className, children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={`landing-note ${className || ""}`.trim()} aria-hidden="true">
      {children}
    </div>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function StatCard({ value, label, tint = "" }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={`landing-stat ${tint}`.trim()}>
      <div className="landing-stat__value">{value}</div>
      <div className="landing-stat__label">{label}</div>
    </div>
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Landing() {
  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    document.body.setAttribute("data-static-page", "landing");
    return () => document.body.removeAttribute("data-static-page");
  }, []);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="landing">
      <header className="landing-top">
        <div className="landing-top__inner">
          <Link to="/" className="landing-brand" aria-label="ClarityMusic">
            <ClarityLogo height={46} className="clarity-logo--landingTop" />
          </Link>

          <nav className="landing-nav" aria-label="Primary">
            <a href="#features">Можливості</a>
            <a href="#support">Підтримка</a>
            <a href="#access">Веб-версія</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__inner">
            <Note className="n1">♪</Note>
            <Note className="n2">♫</Note>
            <Note className="n3">♩</Note>
            <Note className="n4">♬</Note>

            <div className="landing-hero__grid">
              <div className="landing-hero__copy">
                <div className="landing-title">ClarityMusic</div>
                <h1 className="landing-h1">Музичний сервіс для треків, плейлистів і профілів артистів.</h1>
                <p className="landing-sub">
                  У застосунку можна шукати треки, відкривати профілі артистів,
                  зберігати вподобані композиції та працювати з плейлистами.
                </p>

                <div className="landing-cta">
                  <Link to="/login" className="landing-btn landing-btn--primary">
                    Перейти на сайт
                  </Link>
                  <Link to="/register" className="landing-btn landing-btn--secondary">
                    Зареєструватися
                  </Link>
                </div>
              </div>

              <div className="landing-hero__art" aria-hidden="true">
                <div className="landing-logoart">
                  <div className="landing-logoart__panel">
                    <ClarityLogo height={46} className="clarity-logo--landingPanel" />
                  </div>
                  <div className="landing-eq" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats" id="features">
          <div className="landing-stats__inner">
            <StatCard value="Пошук" label="треків" tint="tint-a" />
            <StatCard value="Плеєр" label="і відтворення" tint="tint-b" />
            <StatCard value="Плейлисти" label="та вподобання" tint="tint-c" />
          </div>
        </section>

        <section className="landing-sections" id="support">
          <div className="landing-section">
            <h2>Підтримка</h2>
            <p>
              Якщо виникнуть питання з входом, профілем або плейлистами,
              скористайтеся відповідними сторінками в застосунку.
            </p>
          </div>

          <div className="landing-section" id="access">
            <h2>Веб-версія</h2>
            <p>
              Сервіс працює в браузері без окремого встановлення. У веб-версії
              доступні пошук, плеєр, вподобані треки та плейлисти.
            </p>
            <div className="landing-chipRow">
              <button className="landing-btn landing-btn--chip" disabled>
                Працює в браузері
              </button>
              <button className="landing-btn landing-btn--chip" disabled>
                Без встановлення
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__primary">© {new Date().getFullYear()} ClarityMusic</div>
        </div>
      </footer>
    </div>
  );
}
