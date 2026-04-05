

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RouteLoadingFallback() {
  const { t } = useI18n();
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className="page-shell page-state">{t("route.loading")}</div>;
}
