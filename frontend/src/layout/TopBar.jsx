

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../services/api.js";
import { Brand } from "../ui/Brand.jsx";
import { useShell } from "../contexts/ShellContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";
import { MenuItem, MenuPopover, useLayerDismiss, usePopoverStyle } from "../ui/MenuPopover.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function TopBar() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useShell();
  const { me, logout } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState({ artists: [], tracks: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchRootRef = useRef(null);
  const menuAnchorRef = useRef(null);
  const { style: menuStyle, menuRef } = usePopoverStyle(menuOpen, menuAnchorRef, {
    align: "right",
    side: "auto",
    minWidth: 208,
    maxWidth: 236,
    width: 220,
    estimatedHeight: 220,
  });

  useLayerDismiss(searchOpen, searchRootRef, () => setSearchOpen(false));
  useLayerDismiss(menuOpen, [menuAnchorRef, menuRef], () => setMenuOpen(false));

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const query = String(searchQuery || "").trim();
      if (!query) {
        setResults({ artists: [], tracks: [] });
        setStatus("idle");
        setBusy(false);
        return;
      }
      if (query.length < 2) {
        setResults({ artists: [], tracks: [] });
        setStatus("hint");
        setBusy(false);
        return;
      }

      setBusy(true);
      setSearchOpen(true);
      const response = await globalSearch(query, );
      if (!alive) return;
      setResults({
        artists: Array.isArray(response?.data?.artists) ? response.data.artists : [],
        tracks: Array.isArray(response?.data?.tracks) ? response.data.tracks : [],
      });
      setStatus(response?.status || "success");
      setBusy(false);
      setActiveIndex(-1);
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const searchItems = useMemo(() => ([
    ...results.artists.map((artist) => ({ type: "artist", id: artist.id, title: artist.name, subtitle: "artist", image: artist.avatarUrl })),
    ...results.tracks.map((track) => ({ type: "track", id: track.id, title: track.title, subtitle: track.artistName || track.artist?.name || "", image: track.coverUrl })),
  ]), [results]);

  const displayName = String(me?.displayName || me?.name || "tc").trim() || "tc";
  const isAdmin = !!me?.isAdmin;

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function closeSearchAndNavigate(targetUrl) {
    setSearchOpen(false);
    setActiveIndex(-1);
    setSearchQuery("");
    navigate(targetUrl);
  }

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <header className="topBar">
      <div className="topBar__left">
        <button type="button" className="brandButton" onClick={() => navigate("/app")} aria-label="Go home">
          <Brand />
        </button>
      </div>

      <div className="topBar__center" ref={searchRootRef}>
        <div className="searchBox">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (event.target.value.trim()) setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchItems.length || searchQuery.trim()) setSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearchOpen(false);
                setActiveIndex(-1);
                return;
              }
              if (!searchItems.length) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((value) => (value + 1) % searchItems.length);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((value) => (value <= 0 ? searchItems.length - 1 : value - 1));
              }
              if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                const item = searchItems[activeIndex];
                closeSearchAndNavigate(item.type === "artist" ? `/app/artists/${item.id}` : `/app/track/${item.id}`);
              }
            }}
            placeholder="Search tracks, artists..."
            aria-label="Search tracks and artists"
          />

          {searchQuery ? (
            <button type="button" className="iconButton iconButton--bare searchBox__clear" onClick={() => { setSearchQuery(""); setSearchOpen(false); }}>
              ×
            </button>
          ) : null}

          {searchOpen ? (
            <div className="searchDropdown surface">
              {busy ? <div className="searchDropdown__hint">Searching…</div> : null}
              {!busy && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? <div className="searchDropdown__hint">Type at least 2 characters</div> : null}
              {!busy && status === "empty" && !searchItems.length ? <div className="searchDropdown__hint">Nothing found</div> : null}

              {results.artists.length ? <div className="searchDropdown__title">ARTISTS</div> : null}
              {results.artists.map((artist, index) => (
                <button
                  type="button"
                  key={`artist-${artist.id}`}
                  className={`searchRow ${activeIndex === index ? "is-active" : ""}`.trim()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => closeSearchAndNavigate(`/app/artists/${artist.id}`)}
                >
                  <AvatarArt src={artist.avatarUrl} name={artist.name} className="searchRow__media" />
                  <span className="searchRow__text"><strong>{artist.name}</strong><span>artist</span></span>
                </button>
              ))}

              {results.tracks.length ? <div className="searchDropdown__title">TRACKS</div> : null}
              {results.tracks.map((track, index) => {
                const flatIndex = results.artists.length + index;
                // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
                return (
                  <button
                    type="button"
                    key={`track-${track.id}`}
                    className={`searchRow ${activeIndex === flatIndex ? "is-active" : ""}`.trim()}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => closeSearchAndNavigate(`/app/track/${track.id}`)}
                  >
                    <CoverArt src={track.coverUrl} title={track.title} className="searchRow__media" />
                    <span className="searchRow__text"><strong>{track.title}</strong><span>{track.artistName || track.artist?.name || ""}</span></span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="topBar__right">
        <button ref={menuAnchorRef} type="button" className="profileButton" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
          <AvatarArt src={me?.avatarUrl} name={displayName} className="profileButton__avatar" />
          <span className="profileButton__name">{displayName}</span>
          <span className="profileButton__caret">▾</span>
        </button>

        <MenuPopover open={menuOpen} style={menuStyle} menuRef={menuRef}>
          <MenuItem onClick={() => { setMenuOpen(false); navigate("/app/me"); }}>My profile</MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}>Settings</MenuItem>
          {isAdmin ? <MenuItem onClick={() => { setMenuOpen(false); navigate("/admin"); }}>Admin panel</MenuItem> : null}
          <MenuItem danger onClick={handleLogout}>Log out</MenuItem>
        </MenuPopover>
      </div>
    </header>
  );
}
