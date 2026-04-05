

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Surface } from "../ui/Surface.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlaceholderPage({ title, description }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className="pageStack"><Surface className="pageHero"><h1>{title}</h1><p>{description}</p></Surface></div>;
}
