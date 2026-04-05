

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClarityLogo from "../brand/ClarityLogo.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { isAdmin, isArtist } from "../../utils/auth.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function SiteFooter() {
  const { me } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
  });
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const hasArtistAccount = isArtist(me);
  const hasAdminAccess = isAdmin(me);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPhoneMode = viewportWidth <= 767;

  if (isPhoneMode) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <footer className="sitefooter sitefooter--phone">
        <div className="sitefooter__inner">
          <div className="sitefooter__compactRow sitefooter__compactRow--phone">
            <div className="sitefooter__brandInline" aria-hidden="true">
              <ClarityLogo height={28} compact className="clarity-logo--footer" />
            </div>

            <nav className="sitefooter__linksCompact sitefooter__linksCompact--phone" aria-label="Footer navigation">
              <Link to="/app/liked">{t("profile.likedTracks")}</Link>
              <Link to="/app/settings">{t("common.settings")}</Link>
              <Link to={hasArtistAccount ? "/app/artist/studio" : "/app/me"}>
                {hasArtistAccount ? t("common.studio") : t("common.account")}
              </Link>
              {hasAdminAccess ? <Link to="/admin/tracks">{t("common.adminPanel")}</Link> : null}
            </nav>

            <div className="sitefooter__metaCompact">© {year} CLARITY.music</div>
          </div>
        </div>
      </footer>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <footer className="sitefooter">
      <div className="sitefooter__inner">
        <div className="sitefooter__brandRow">
          <div className="sitefooter__brand">
            <ClarityLogo height={42} className="clarity-logo--footer" />
            <p className="sitefooter__description">{t("footer.description")}</p>
          </div>

          <nav className="sitefooter__linksCompact" aria-label="Footer navigation">
            <Link to="/app">{t("common.home")}</Link>
            <Link to="/app/liked">{t("profile.likedTracks")}</Link>
            <Link to="/app/me">{t("common.profile")}</Link>
            <Link to={hasArtistAccount ? "/app/artist/studio" : "/app/me"}>
              {hasArtistAccount ? t("common.studio") : t("common.account")}
            </Link>
            <Link to="/app/settings">{t("common.settings")}</Link>
            {hasAdminAccess ? <Link to="/admin/tracks">{t("common.adminPanel")}</Link> : null}
          </nav>

          <div className="sitefooter__metaCompact">© {year} CLARITY.music</div>
        </div>
      </div>
    </footer>
  );
}
