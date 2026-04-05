

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import Sidebar from "../components/layout/Sidebar.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Library() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <section className="mobile-libraryPage">
      <Sidebar mode="page" />
    </section>
  );
}
