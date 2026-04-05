

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { globalSearch, MIN_SEARCH_QUERY_LENGTH } from "../../services/api.js";
import ClarityLogo from "../brand/ClarityLogo.jsx";
import CoverArt from "../media/CoverArt.jsx";
import ArtistAvatar from "../media/ArtistAvatar.jsx";
import { toAbs } from "../../services/media.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { isAdmin } from "../../utils/auth.js";
import { useAppState } from "../../context/AppStateContext.jsx";
import { FloatingMenu, FloatingMenuItem, FloatingMenuSeparator, useFloatingStyle, useOutsideClose } from "../ui/FloatingMenu.jsx";

const MOBILE_SIDEBAR_BREAKPOINT = 980;
const PHONE_BREAKPOINT = 767;

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function TopBar() {
  const nav = useNavigate();
  const location = useLocation();
  const { me, logout } = useAuth();
  const { t } = useI18n();
  const { leftSidebarOpen, toggleLeftSidebar } = useAppState();
  const profileAvatarUrl = toAbs(me?.avatarUrl || me?.avatar || "");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
  });

  const isPhoneMode = viewportWidth <= PHONE_BREAKPOINT;
  const isTabletSidebarMode = viewportWidth <= MOBILE_SIDEBAR_BREAKPOINT && viewportWidth > PHONE_BREAKPOINT;
  const isSearchRoute = location.pathname.startsWith("/app/search");

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [searchError, setSearchError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const debRef = useRef(null);
  const searchAbortRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const profileRootRef = useRef(null);
  const searchRootRef = useRef(null);
  const searchAnchorRef = useRef(null);
  const profileAnchorRef = useRef(null);

  useOutsideClose(menuOpen, profileRootRef, () => setMenuOpen(false));
  useOutsideClose(searchOpen, searchRootRef, () => setSearchOpen(false));

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // Нижче оголошено обробник який реагує на дію користувача і змінює стан
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!isPhoneMode) return;
    setSearchOpen(false);
    setQ("");
    setArtists([]);
    setTracks([]);
    setBusy(false);
    setSearchStatus("idle");
    setSearchError("");
    setActiveIndex(-1);
  }, [isPhoneMode]);

  const searchMenuStyle = useFloatingStyle(searchOpen, searchAnchorRef, { align: "left", widthMode: "anchor", minWidth: 280, gap: 10, maxWidth: 440 });
  const profileMenuStyle = useFloatingStyle(menuOpen, profileAnchorRef, { align: "right", widthMode: "fixed", minWidth: 208, gap: 8, maxWidth: 240 });

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const searchItems = useMemo(() => ([
    ...artists.map((artist) => ({ type: "artist", id: artist.id, label: artist.name, sub: t("common.artist"), data: artist })),
    ...tracks.map((track) => ({ type: "track", id: track.id, label: track.title, sub: track?.artist?.name || "", data: track })),
  ]), [artists, tracks, t]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const runSearch = useCallback(async (raw) => {
    const term = String(raw || "").trim();
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    if (!term) {
      setArtists([]);
      setTracks([]);
      setSearchOpen(false);
      setBusy(false);
      setSearchStatus("idle");
      setSearchError("");
      setActiveIndex(-1);
      return;
    }

    if (term.length < MIN_SEARCH_QUERY_LENGTH) {
      setArtists([]);
      setTracks([]);
      setSearchOpen(true);
      setBusy(false);
      setSearchStatus("idle");
      setSearchError("");
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;
    setBusy(true);
    setSearchOpen(true);
    setSearchStatus("loading");
    setSearchError("");

    try {
      const res = await globalSearch(term, { signal: controller.signal, timeoutMs: 10000 });

      if (searchRequestIdRef.current !== requestId) return;
      setArtists(Array.isArray(res.data?.artists) ? res.data.artists : []);
      setTracks(Array.isArray(res.data?.tracks) ? res.data.tracks : []);
      setSearchStatus(res.status || "success");
      setSearchError(res.error || "");
      setActiveIndex(-1);
    } catch {
      if (!controller.signal.aborted) {
        setArtists([]);
        setTracks([]);
        setSearchStatus("hard-error");
        setSearchError(t("common.genericError"));
      }
    } finally {
      if (searchRequestIdRef.current === requestId) setBusy(false);
      if (searchAbortRef.current === controller) searchAbortRef.current = null;
    }
  }, [t]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (isPhoneMode) return undefined;
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => runSearch(q), 220);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [isPhoneMode, q, runSearch]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => () => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
  }, []);

  const hasAny = artists.length > 0 || tracks.length > 0;
  const showHardError = !busy && searchStatus === "hard-error";
  const showPartialError = !busy && searchStatus === "partial-error";
  const showEmpty = !busy && searchStatus === "empty" && !hasAny;

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function goTrack(id) {
    setSearchOpen(false);
    setQ("");
    setActiveIndex(-1);
    nav(`/app/track/${id}`);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function goArtist(id) {
    setSearchOpen(false);
    setQ("");
    setActiveIndex(-1);
    nav(`/app/artists/${id}`);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function activateItem(item) {
    if (!item) return;
    if (item.type === "artist") goArtist(item.id);
    if (item.type === "track") goTrack(item.id);
  }

  const profileButton = (
    <button
      className={`profile-btn${isPhoneMode ? " profile-btn--phone" : ""}`}
      onClick={() => setMenuOpen((v) => !v)}
      title={me?.isAuthenticated ? me?.email || t("common.profile") : t("common.login")}
      type="button"
      aria-expanded={menuOpen}
    >
      <ArtistAvatar src={profileAvatarUrl} name={me?.name || me?.username || me?.email || "Profile"} className="profile-avatar" imgClassName="profile-avatar__img" aria-hidden="true" />
      {!isPhoneMode ? <span className="profile-name">{me?.isAuthenticated ? me?.name || me?.username || t("common.profile") : t("common.guest")}</span> : null}
      {!isPhoneMode ? <span className="profile-caret">▾</span> : null}
    </button>
  );

  if (isPhoneMode) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="topbar topbar--phone">
        <div className="topbar__left topbar__left--phone">
          <button className="topbar__phoneBrand" type="button" onClick={() => nav("/app")} aria-label="CLARITY.music home">
            <ClarityLogo height={24} phoneCompact className="clarity-logo--topbar clarity-logo--phone clarity-logo--phoneCompact" />
          </button>
        </div>

        <div className="topbar__center topbar__center--phone">
          {isSearchRoute ? (
            <div className="topbar__phoneSearchLauncher topbar__phoneSearchLauncher--current" aria-current="page">
              <span className="topbar__phoneSearchIcon" aria-hidden="true">⌕</span>
              <span className="topbar__phoneSearchText">{t("common.searchPlaceholder")}</span>
            </div>
          ) : (
            <button
              type="button"
              className="topbar__phoneSearchLauncher"
              onClick={() => nav("/app/search")}
              aria-label={t("common.searchPlaceholder")}
            >
              <span className="topbar__phoneSearchIcon" aria-hidden="true">⌕</span>
              <span className="topbar__phoneSearchText">{t("common.searchPlaceholder")}</span>
            </button>
          )}
        </div>

        <div className="topbar__right topbar__right--phone">
          <button
            type="button"
            className="topbar__phoneSettings"
            onClick={() => nav("/app/settings")}
            aria-label={t("common.settings")}
            title={t("common.settings")}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>
      </div>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="topbar">
      <div className="topbar__left">
        {isTabletSidebarMode ? (
          <button
            className="icon-btn topbar__menuBtn"
            type="button"
            aria-label={leftSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={leftSidebarOpen}
            aria-controls="app-left-sidebar"
            onClick={toggleLeftSidebar}
          >
            <span className="topbar__menuGlyph" aria-hidden="true">☰</span>
          </button>
        ) : null}

        <span className="topbar__brandText" title="CLARITY.music" onClick={() => nav("/app")}>
          <ClarityLogo height={40} compact className="clarity-logo--topbar" />
        </span>
      </div>

      <div className="topbar__center" ref={searchRootRef}>
        <div className="searchbox" data-ui-dd-root ref={searchAnchorRef}>
          <input
            className="topbar__search"
            aria-label={t("common.searchPlaceholder")}
            aria-expanded={searchOpen}
            aria-controls="topbar-search-results"
            aria-autocomplete="list"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);
              if (String(value || "").trim()) setSearchOpen(true);
            }}
            placeholder={t("common.searchPlaceholder")}
            onFocus={() => {
              if (String(q || "").trim()) setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchOpen(false);
                setActiveIndex(-1);
                return;
              }
              if (!searchOpen || searchItems.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % searchItems.length);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev <= 0 ? searchItems.length - 1 : prev - 1));
              }
              if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                activateItem(searchItems[activeIndex]);
              }
            }}
          />

          {q ? (
            <button className="icon-btn topbar__clearBtn" onClick={() => { setQ(""); setSearchOpen(false); setActiveIndex(-1); }} title={t("common.clear")} type="button">✕</button>
          ) : null}

          <FloatingMenu open={searchOpen} align="left" className="topbarSearchMenu" style={searchMenuStyle} portal id="topbar-search-results" role="listbox">
            {busy ? <div className="ui-dd__hint">{t("common.searching")}</div> : null}
            {!busy && String(q || "").trim().length > 0 && String(q || "").trim().length < MIN_SEARCH_QUERY_LENGTH ? <div className="ui-dd__hint">{t("common.typeMore", `Введи щонайменше ${MIN_SEARCH_QUERY_LENGTH} символи`)}</div> : null}
            {showHardError ? <div className="ui-dd__hint">{searchError || t("common.genericError")}</div> : null}
            {showPartialError ? <div className="ui-dd__hint">{searchError || t("common.partialResults")}</div> : null}
            {showEmpty ? <div className="ui-dd__hint">{t("common.nothingFound")}</div> : null}

            {artists.length > 0 ? (
              <div className="ui-dd__section">
                <div className="ui-dd__title">{t("common.artists")}</div>
                <div className="ui-dd__list">
                  {artists.map((artist, index) => {
                    const flatIndex = index;
                    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
                    return (
                      <button key={artist.id ?? artist.name} className={`ui-dd__row ${activeIndex === flatIndex ? "is-active" : ""}`} onClick={() => artist?.id && goArtist(artist.id)} type="button" role="option" aria-selected={activeIndex === flatIndex} onMouseEnter={() => setActiveIndex(flatIndex)}>
                        <ArtistAvatar src={artist?.avatarUrl} name={artist?.name || "Artist"} className="ui-dd__img" />
                        <span className="ui-dd__meta"><span className="ui-dd__name">{artist?.name || "Artist"}</span><span className="ui-dd__sub">{t("common.artist")}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tracks.length > 0 ? (
              <div className="ui-dd__section">
                <div className="ui-dd__title">{t("common.tracks")}</div>
                <div className="ui-dd__list">
                  {tracks.map((track, index) => {
                    const flatIndex = artists.length + index;
                    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
                    return (
                      <button key={track.id} className={`ui-dd__row ${activeIndex === flatIndex ? "is-active" : ""}`} onClick={() => goTrack(track.id)} type="button" role="option" aria-selected={activeIndex === flatIndex} onMouseEnter={() => setActiveIndex(flatIndex)}>
                        <CoverArt src={track?.coverUrl} title={track?.title || "Track"} className="ui-dd__img" />
                        <span className="ui-dd__meta"><span className="ui-dd__name">{track?.title || "Track"}</span><span className="ui-dd__sub">{track?.artist?.name || ""}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </FloatingMenu>
        </div>
      </div>

      <div className="topbar__right">
        <div className="profile-menu" ref={profileRootRef}>
          <div className="topbar__menuAnchor" data-ui-dd-root ref={profileAnchorRef}>
            {profileButton}

            <FloatingMenu open={menuOpen} align="right" className="topbarProfileMenu" style={profileMenuStyle} portal role="menu">
              {me?.isAuthenticated ? (
                <>
                  <FloatingMenuItem onClick={() => { setMenuOpen(false); nav("/app/me"); }}>{t("common.profile")}</FloatingMenuItem>
                  <FloatingMenuItem onClick={() => { setMenuOpen(false); nav("/app/settings"); }}>{t("common.settings")}</FloatingMenuItem>
                  {isAdmin(me) ? <FloatingMenuItem onClick={() => { setMenuOpen(false); nav("/admin/tracks"); }}>{t("common.adminPanel")}</FloatingMenuItem> : null}
                  <FloatingMenuSeparator />
                  <FloatingMenuItem danger onClick={async () => { setMenuOpen(false); await logout(); nav("/login"); }}>{t("common.logout")}</FloatingMenuItem>
                </>
              ) : (
                <>
                  <FloatingMenuItem onClick={() => { setMenuOpen(false); nav("/login"); }}>{t("common.login")}</FloatingMenuItem>
                  <FloatingMenuItem onClick={() => { setMenuOpen(false); nav("/register"); }}>{t("common.register")}</FloatingMenuItem>
                </>
              )}
            </FloatingMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
