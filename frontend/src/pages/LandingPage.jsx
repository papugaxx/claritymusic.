

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link } from "react-router-dom";
import { Brand } from "../ui/Brand.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function LandingPage() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="landingPage">
      <header className="landingPage__top"><Brand /></header>
      <main className="landingHero surface">
        <div>
          <div className="landingHero__eyebrow">CLARITY.music</div>
          <h1>Закортілося чогось новенького у рутині?</h1>
          <p>Мерщій приєднуйся до забави музики. Темний фіолетовий вайб, плейлисти, лайки та плеєр — все як у reference-проєкті.</p>
          <div className="landingHero__actions">
            <Link to="/login" className="primaryButton">Перейти на сайт</Link>
            <Link to="/register" className="secondaryButton">Зареєструватися</Link>
          </div>
        </div>
        <div className="landingHero__art surface"><Brand large /><span>MUSIC WITHOUT LIMITS</span></div>
      </main>
    </div>
  );
}
