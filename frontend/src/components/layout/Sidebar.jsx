

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { apiFetch, createPlaylist as createPlaylistRequest, deletePlaylist, getPlaylists, updatePlaylist } from "../../services/api.js";
import Modal from "../ui/Modal.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import { useAppState } from "../../context/AppStateContext.jsx";
import { readStorage, writeStorage } from "../../utils/storage.js";
import LikedCover from "../media/LikedCover.jsx";
import { IMAGE_ACCEPT, validateImageFile } from "../../services/uploadValidation.js";
import { MenuDotsIcon, PlusIcon, SearchIcon } from "../../features/library/SidebarIcons.jsx";
import { PlaylistMenu } from "../../features/library/PlaylistMenu.jsx";
import { LibraryRow } from "../../features/library/SidebarRow.jsx";
import { bumpRecent, readRecentIds, toCoverUrl } from "../../features/library/sidebarStorage.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Sidebar({ mode = "sidebar" }) {
  const nav = useNavigate();
  const { t } = useI18n();
  const { playlistsVersion, notifyPlaylistsChanged } = useAppState();

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playlists, setPlaylists] = useState([]);
  const [playlistsBusy, setPlaylistsBusy] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [name, setName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [err, setErr] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState(() => readStorage("clarity:library:sort", "recent") || "recent");

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState(null);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const emptyPlaylistsText = useMemo(() => {
    const direct = t("playlists.noPlaylists");
    if (direct && direct !== "playlists.noPlaylists" && direct !== "playlists.NoPlaylists") return direct;
    const fallback = t("playlists.empty");
    if (fallback && fallback !== "playlists.empty") return fallback;
    return t("library.empty");
  }, [t]);

  const inputRef = useRef(null);
  const renameInputRef = useRef(null);
  const triggerRefs = useRef(new Map());
  const coverInputRefs = useRef(new Map());

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadPlaylists = useCallback(async () => {
    setPlaylistsBusy(true);
    setPlaylistsError("");
    try {
      const res = await getPlaylists();
      if (!res.ok) {
        setPlaylistsError(res.error || t("playlists.loadFailed"));
        return;
      }
      setPlaylists(Array.isArray(res.data) ? res.data : []);
      setPlaylistsError("");
    } catch {
      setPlaylistsError(t("playlists.loadFailed"));
    } finally {
      setPlaylistsBusy(false);
    }
  }, [t]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const id = window.setTimeout(() => {
      loadPlaylists();
    }, 0);

    return () => {
      window.clearTimeout(id);
    };
  }, [loadPlaylists, playlistsVersion]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (createOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [createOpen]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (renameOpen) {
      setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  }, [renameOpen]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    writeStorage("clarity:library:sort", sortMode);
  }, [sortMode]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onDocMouseDown(event) {
      if (menuOpenId == null) return;

      const triggerNode = triggerRefs.current.get(menuOpenId);
      const floatingMenu = document.querySelector(".playlistMenu");

      const clickedTrigger = !!triggerNode && triggerNode.contains(event.target);
      const clickedMenu = !!floatingMenu && floatingMenu.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setMenuOpenId(null);
        setMenuAnchorRect(null);
      }
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpenId(null);
        setMenuAnchorRect(null);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenId]);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (menuOpenId == null) return;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function updateAnchor() {
      const node = triggerRefs.current.get(menuOpenId);
      if (!node) return;
      setMenuAnchorRect(node.getBoundingClientRect());
    }

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [menuOpenId]);

  
  async function createPlaylist(event) {
    event?.preventDefault?.();
    setErr("");

    const trimmed = name.trim();
    if (!trimmed) {
      setErr(t("playlists.enterName"));
      return;
    }

    try {
      const res = await createPlaylistRequest({ name: trimmed });
      if (!res.ok) {
        setErr(res.error || t("playlists.createFailed"));
        return;
      }

      const nextId = res.data?.id ?? null;

      setName("");
      setCreateOpen(false);
      notifyPlaylistsChanged();

      if (nextId) {
        bumpRecent(nextId);
        nav(`/app/playlist/${nextId}`);
      }
    } catch {
      setErr(t("playlists.createFailed"));
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function renamePlaylist(id) {
    const currentName = playlists.find((item) => item.id === id)?.name || "";
    setErr("");
    setRenameTargetId(id);
    setRenameName(currentName);
    setRenameOpen(true);
    setMenuOpenId(null);
    setMenuAnchorRect(null);
  }

  async function submitRenamePlaylist(event) {
    event?.preventDefault?.();
    setErr("");

    if (!renameTargetId) return;

    const currentName = playlists.find((item) => item.id === renameTargetId)?.name || "";
    const trimmed = renameName.trim();

    if (!trimmed) {
      setErr(t("playlists.enterName"));
      return;
    }

    if (trimmed === currentName.trim()) {
      setRenameOpen(false);
      setRenameTargetId(null);
      return;
    }

    try {
      const res = await updatePlaylist(renameTargetId, { name: trimmed });
      if (!res.ok) {
        setErr(res.error || t("playlists.renameFailed"));
        return;
      }

      setRenameOpen(false);
      setRenameTargetId(null);
      setRenameName("");
      notifyPlaylistsChanged();
    } catch {
      setErr(t("playlists.renameFailed"));
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function removePlaylist(id) {
    const playlist = playlists.find((item) => item.id === id) || null;
    if (!playlist) return;

    setDeleteTarget(playlist);
    setMenuOpenId(null);
    setMenuAnchorRect(null);
  }

  async function confirmRemovePlaylist() {
    if (!deleteTarget?.id) return;

    try {
      const res = await deletePlaylist(deleteTarget.id);
      if (!res.ok) {
        setErr(res.error || t("playlists.deleteFailed"));
        return;
      }

      if (window.location.pathname === `/app/playlist/${deleteTarget.id}`) {
        nav("/app");
      }

      setDeleteTarget(null);
      notifyPlaylistsChanged();
    } catch {
      setErr(t("playlists.deleteFailed"));
    }
  }

  async function uploadPlaylistCover(playlistId, file) {
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await apiFetch(`/api/playlists/${playlistId}/cover`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        return { ok: false, error: res.error || t("upload.failed") };
      }

      if (!(res.data?.coverUrl || res.data?.url)) {
        return { ok: false, error: t("playlist.coverMissing") };
      }

      notifyPlaylistsChanged();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || t("upload.failed") };
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function triggerCoverUpload(id) {
    const input = coverInputRefs.current.get(id);
    if (input) input.click();
  }

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const items = useMemo(() => {
    const list = playlists.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
      coverUrl: toCoverUrl(item.coverUrl),
    }));

    const query = q.trim().toLowerCase();
    const filtered = query
      ? list.filter((item) => item.name.toLowerCase().includes(query))
      : list;

    if (sortMode === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name, "uk", { sensitivity: "base" }));
      return filtered;
    }

    const recentIds = readRecentIds().map((item) => item.id);
    const recentIndex = new Map(recentIds.map((id, index) => [id, index]));

    filtered.sort((a, b) => {
      const ia = recentIndex.has(a.id) ? recentIndex.get(a.id) : 9999;
      const ib = recentIndex.has(b.id) ? recentIndex.get(b.id) : 9999;
      if (ia !== ib) return ia - ib;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return filtered;
  }, [playlists, q, sortMode]);

  const activePlaylist = items.find((item) => item.id === menuOpenId) || null;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <>
      <div className={`sidecard${mode === "page" ? " sidecard--page" : ""}`}>
        <div className="libraryHead">
          <div className="libraryHead__title">{t("playlists.library")}</div>

          <div className="libraryHead__actions">
            <button
              className="iconBtn"
              type="button"
              title={createOpen ? t("playlists.closeCreatePlaylist") : t("playlists.createPlaylist")}
              aria-label={createOpen ? t("playlists.closeCreatePlaylist") : t("playlists.createPlaylist")}
              onClick={() => {
                setErr("");
                setCreateOpen((value) => !value);
                setMenuOpenId(null);
                setMenuAnchorRect(null);
              }}
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <div className="libToolsRow">
          <button
            className="iconBtn iconBtn--ghost"
            type="button"
            title={searchOpen ? t("playlists.closeSearch") : t("artists.search")}
            aria-label={searchOpen ? t("playlists.closeSearch") : t("artists.search")}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <SearchIcon />
          </button>

          <button
            className="libSort__btn"
            type="button"
            title={t("playlists.sortPlaylists")}
            onClick={() => setSortMode((mode) => (mode === "recent" ? "alpha" : "recent"))}
          >
            {sortMode === "recent" ? t("common.recents") : t("common.az")} <span className="libSort__icon">≡</span>
          </button>
        </div>

        {searchOpen ? (
          <div className="libSearch">
            <input
              className="input"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t("playlists.searchInLibrary")}
            />

            {q ? (
              <button className="iconBtn" type="button" title={t("common.clear")} onClick={() => setQ("")}>
                ✕
              </button>
            ) : null}
          </div>
        ) : null}

        {!createOpen && !renameOpen && !deleteTarget && err ? (
          <div className="libCreate__err libCreate__err--mb">
            {err}
          </div>
        ) : null}

        <div className="sidecard__section sidecard__section--spaced">
          {playlistsError && items.length ? (
            <div className="libCreate__err libCreate__err--mb">
              {playlistsError} <button className="btn" type="button" onClick={() => void loadPlaylists()}>{t("common.retry")}</button>
            </div>
          ) : null}
          <div className="sidecard__nav libScroll sidecard__nav--dense">
            <LibraryRow
              to="/app/liked"
              title={t("playlists.likedSongs")}
              subtitle={t("playlists.playlist")}
              img={null}
              coverNode={<LikedCover className="libRow__img" />}
              onOpen={() => {
                setMenuOpenId(null);
                setMenuAnchorRect(null);
              }}
            />

            {items.map((playlist) => {
              const isMenuOpen = menuOpenId === playlist.id;

              // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
              return (
                <LibraryRow
                  key={playlist.id}
                  to={`/app/playlist/${playlist.id}`}
                  title={playlist.name}
                  subtitle={t("playlists.playlist")}
                  img={playlist.coverUrl}
                  isMenuOpen={isMenuOpen}
                  onOpen={() => {
                    bumpRecent(playlist.id);
                    setMenuOpenId(null);
                    setMenuAnchorRect(null);
                  }}
                  actions={
                    <div className="libMoreWrap">
                      <button
                        ref={(node) => {
                          if (node) triggerRefs.current.set(playlist.id, node);
                          else triggerRefs.current.delete(playlist.id);
                        }}
                        className="libMoreBtn"
                        type="button"
                        title={t("common.playlistActions")}
                        aria-label={t("common.playlistActions")}
                        aria-expanded={isMenuOpen}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (isMenuOpen) {
                            setMenuOpenId(null);
                            setMenuAnchorRect(null);
                            return;
                          }

                          setMenuOpenId(playlist.id);
                          setMenuAnchorRect(event.currentTarget.getBoundingClientRect());
                        }}
                      >
                        <MenuDotsIcon />
                      </button>

                      <input
                        ref={(node) => {
                          if (node) coverInputRefs.current.set(playlist.id, node);
                          else coverInputRefs.current.delete(playlist.id);
                        }}
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="u-hidden-input"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";

                          if (!file) return;

                          const validationError = validateImageFile(file, { maxBytes: 10 * 1024 * 1024 });
                          if (validationError) {
                            setErr(validationError);
                            return;
                          }

                          const result = await uploadPlaylistCover(playlist.id, file);
                          if (!result.ok) {
                            setErr(result.error || t("playlists.coverUploadFailed"));
                          }

                          setMenuOpenId(null);
                          setMenuAnchorRect(null);
                        }}
                      />
                    </div>
                  }
                />
              );
            })}

            {playlistsBusy && !items.length ? <div className="libEmpty">{t("common.loading")}</div> : null}
            {!playlistsBusy && playlistsError && !items.length ? (
              <div className="libEmpty">
                <div>{playlistsError}</div>
                <button className="btn" type="button" onClick={() => void loadPlaylists()}>{t("common.retry")}</button>
              </div>
            ) : null}
            {!playlistsBusy && !playlistsError && !items.length ? <div className="libEmpty">{emptyPlaylistsText}</div> : null}
          </div>
        </div>
      </div>

      <Modal
        open={createOpen}
        title={t("playlists.createTitle")}
        onClose={() => setCreateOpen(false)}
        contentClassName="modal--compact"
        footer={
          <>
            <button className="btn" type="button" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn primary" type="button" onClick={createPlaylist}>
              {t("playlists.createTitle")}
            </button>
          </>
        }
      >
        <form onSubmit={createPlaylist} className="libCreate__row">
          <input
            ref={inputRef}
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("playlists.placeholder")}
            maxLength={80}
          />
        </form>
        {err ? <div className="libCreate__err libCreate__err--mt">{err}</div> : null}
      </Modal>

      <Modal
        open={renameOpen}
        title={t("playlists.renameTitle")}
        onClose={() => {
          setRenameOpen(false);
          setRenameTargetId(null);
        }}
        contentClassName="modal--compact"
        footer={
          <>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setRenameOpen(false);
                setRenameTargetId(null);
              }}
            >
              {t("common.cancel")}
            </button>
            <button className="btn primary" type="button" onClick={submitRenamePlaylist}>
              {t("common.save")}
            </button>
          </>
        }
      >
        <form onSubmit={submitRenamePlaylist} className="libCreate__row">
          <input
            ref={renameInputRef}
            className="input"
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            placeholder={t("playlists.newNamePlaceholder")}
            maxLength={80}
          />
        </form>
        {err ? <div className="libCreate__err libCreate__err--mt">{err}</div> : null}
      </Modal>

      <Modal
        open={!!deleteTarget}
        title={t("playlists.deleteTitle")}
        onClose={() => setDeleteTarget(null)}
        contentClassName="modal--compact"
        footer={
          <>
            <button className="btn" type="button" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </button>
            <button className="btn primary" type="button" onClick={confirmRemovePlaylist}>
              {t("common.delete")}
            </button>
          </>
        }
      >
        <div className="sidecard__dialogText">
          {t("playlists.deleteTitle")} <b>{deleteTarget?.name}</b>?
        </div>
        {err ? <div className="libCreate__err libCreate__err--mt">{err}</div> : null}
      </Modal>

      {menuOpenId != null && activePlaylist ? (
        <PlaylistMenu
          playlist={activePlaylist}
          t={t}
          anchorRect={menuAnchorRect}
          onClose={() => {
            setMenuOpenId(null);
            setMenuAnchorRect(null);
          }}
          onOpen={() => {
            bumpRecent(activePlaylist.id);
            nav(`/app/playlist/${activePlaylist.id}`);
            setMenuOpenId(null);
            setMenuAnchorRect(null);
          }}
          onRename={() => renamePlaylist(activePlaylist.id)}
          onChangeCover={() => triggerCoverUpload(activePlaylist.id)}
          onDelete={() => removePlaylist(activePlaylist.id)}
        />
      ) : null}
    </>
  );
}
