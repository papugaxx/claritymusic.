

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { createPlaylist, deletePlaylist, getPlaylists, updatePlaylist, uploadPlaylistCover } from "../services/api.js";
import { validateImageFile } from "../services/uploadValidation.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Field } from "../ui/Field.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { MenuItem, MenuPopover, useLayerDismiss, usePopoverStyle } from "../ui/MenuPopover.jsx";
import "./Sidebar.css";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Sidebar() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuAnchorRef = useRef(null);
  const coverInputRefs = useRef(new Map());

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playlists, setPlaylists] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortMode, setSortMode] = useState("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const menuOpen = Boolean(menuTarget);
  const { style: menuStyle, menuRef } = usePopoverStyle(menuOpen, menuAnchorRef, {
    align: "right",
    side: "auto",
    minWidth: 196,
    maxWidth: 220,
    width: 196,
    estimatedHeight: 206,
  });

  useLayerDismiss(menuOpen, [menuAnchorRef, menuRef], () => setMenuTarget(null));

  async function loadPlaylists() {
    if (!me?.isAuthenticated) {
      setPlaylists([]);
      setError("");
      return;
    }

    setBusy(true);
    const response = await getPlaylists();
    setBusy(false);

    if (!response?.ok) {
      setPlaylists([]);
      setError(response?.error || "Failed to load playlists");
      return;
    }

    setPlaylists(Array.isArray(response.data) ? response.data : []);
    setError("");
  }

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    loadPlaylists();
  }, [me?.isAuthenticated]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!searchOpen) setQuery("");
  }, [searchOpen]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const filteredPlaylists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = playlists.filter((playlist) => playlist?.name?.toLowerCase().includes(normalizedQuery));
    return [...items].sort((left, right) => {
      if (sortMode === "alpha") return String(left.name || "").localeCompare(String(right.name || ""));
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
  }, [playlists, query, sortMode]);

  async function handleCreatePlaylist(event) {
    event?.preventDefault?.();
    const name = draftName.trim();
    if (!name) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }

    setActionBusy(true);
    const response = await createPlaylist({ name });
    setActionBusy(false);
    if (!response?.ok) {
      setError(response?.error || "Failed to create playlist");
      return;
    }

    setCreateOpen(false);
    setDraftName("");
    await loadPlaylists();
    navigate(`/app/playlist/${response.data?.id}`);
  }

  async function handleRenamePlaylist(event) {
    event?.preventDefault?.();
    if (!renameTarget) return;
    const name = draftName.trim();
    if (!name) return;

    setActionBusy(true);
    const response = await updatePlaylist(renameTarget.id, { name });
    setActionBusy(false);
    if (!response?.ok) {
      setError(response?.error || "Failed to rename playlist");
      return;
    }

    setRenameTarget(null);
    setDraftName("");
    await loadPlaylists();
  }

  async function handleDeletePlaylist() {
    if (!deleteTarget) return;
    setActionBusy(true);
    const response = await deletePlaylist(deleteTarget.id);
    setActionBusy(false);
    if (!response?.ok) {
      setError(response?.error || "Failed to delete playlist");
      return;
    }

    const deletedId = deleteTarget.id;
    setDeleteTarget(null);
    await loadPlaylists();
    if (location.pathname === `/app/playlist/${deletedId}`) navigate("/app");
  }

  async function handleCoverPick(playlistId, file) {
    if (!file) return;
    const validationError = validateImageFile(file, { maxBytes: 10 * 1024 * 1024 });
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionBusy(true);
    const response = await uploadPlaylistCover(playlistId, file);
    setActionBusy(false);
    if (!response?.ok) {
      setError(response?.error || "Failed to upload cover");
      return;
    }

    setMenuTarget(null);
    setError("");
    await loadPlaylists();
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function triggerCoverUpload(playlistId) {
    const input = coverInputRefs.current.get(playlistId);
    if (input) input.click();
  }

  const likedActive = location.pathname === "/app/liked";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="sidebar">
      <div className="sidebarHeader">
        <div className="libraryHead">
          <div className="libraryHead__title">Your Library</div>
          <div className="libraryHead__actions">
            <button
              type="button"
              className="sidebarHeader__plus"
              onClick={() => {
                if (!me?.isAuthenticated) {
                  navigate("/login");
                  return;
                }
                setDraftName("");
                setCreateOpen(true);
              }}
              aria-label="Create playlist"
            >
              +
            </button>
          </div>
        </div>

        <div className="sidebarToolbar">
          <button
            type="button"
            className={`sidebarToolbar__search ${searchOpen ? "is-active" : ""}`.trim()}
            onClick={() => setSearchOpen((value) => !value)}
            aria-label="Search in library"
          >
            ⌕
          </button>

          <button
            type="button"
            className="sidebarToolbar__sort"
            onClick={() => setSortMode((value) => (value === "recent" ? "alpha" : "recent"))}
            aria-label="Toggle library sorting"
          >
            <span className="sidebarToolbar__sortLabel">{sortMode === "recent" ? "Recents" : "A–Z"}</span>
            <span className="sidebarToolbar__sortGlyph" aria-hidden="true">≡</span>
          </button>
        </div>

        {searchOpen ? (
          <div className="sidebarSearchWrap">
            <input
              className="sidebarSearchInput"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in library"
              aria-label="Search in library"
              autoFocus
            />
          </div>
        ) : null}

        {error ? <div className="inlineMessage inlineMessage--error">{error}</div> : null}
      </div>

      <div className="libraryList">
        <NavLink to="/app/liked" className={`libraryRow libraryRow--liked ${likedActive ? "is-active" : ""}`.trim()}>
          <span className="libraryRow__media libraryRow__media--liked">♥</span>
          <span className="libraryRow__meta">
            <strong>Liked Songs</strong>
            <span>Playlist</span>
          </span>
        </NavLink>

        {filteredPlaylists.map((playlist) => {
          const isCurrentMenu = menuTarget?.id === playlist.id;
          const isPlaylistActive = location.pathname === `/app/playlist/${playlist.id}`;
          // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
          return (
            <div className={`libraryRowWrap ${isPlaylistActive ? "is-active" : ""}`.trim()} key={playlist.id}>
              <NavLink to={`/app/playlist/${playlist.id}`} className="libraryRow">
                <CoverArt src={playlist.coverUrl} title={playlist.name} className="libraryRow__cover" />
                <span className="libraryRow__meta">
                  <strong>{playlist.name}</strong>
                  <span>Playlist</span>
                </span>
              </NavLink>

              <button
                type="button"
                className="libraryRow__action"
                ref={(node) => {
                  if (isCurrentMenu) menuAnchorRef.current = node;
                }}
                onClick={(event) => {
                  menuAnchorRef.current = event.currentTarget;
                  setMenuTarget((value) => (value?.id === playlist.id ? null : playlist));
                }}
                aria-label="Playlist actions"
                aria-expanded={isCurrentMenu}
              >
                …
              </button>

              <input
                ref={(node) => {
                  if (node) coverInputRefs.current.set(playlist.id, node);
                  else coverInputRefs.current.delete(playlist.id);
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  event.target.value = "";
                  if (file) void handleCoverPick(playlist.id, file);
                }}
              />
            </div>
          );
        })}

        {busy ? <div className="libraryEmpty">Loading…</div> : null}
        {!busy && !filteredPlaylists.length && me?.isAuthenticated ? <div className="libraryEmpty">No playlists yet.</div> : null}
      </div>

      <MenuPopover open={menuOpen} style={menuStyle} menuRef={menuRef}>
        <MenuItem onClick={() => {
          if (!menuTarget?.id) return;
          navigate(`/app/playlist/${menuTarget.id}`);
          setMenuTarget(null);
        }}>Open</MenuItem>
        <MenuItem onClick={() => {
          setDraftName(menuTarget?.name || "");
          setRenameTarget(menuTarget);
          setMenuTarget(null);
        }}>Rename</MenuItem>
        <MenuItem onClick={() => {
          if (menuTarget?.id) triggerCoverUpload(menuTarget.id);
        }}>Change cover</MenuItem>
        <MenuItem danger onClick={() => {
          setDeleteTarget(menuTarget);
          setMenuTarget(null);
        }}>Delete</MenuItem>
      </MenuPopover>

      <Modal title="Create playlist" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="modalForm" onSubmit={handleCreatePlaylist}>
          <Field label="Playlist name" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="My playlist" autoFocus />
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="primaryButton" disabled={actionBusy || !draftName.trim()}>{actionBusy ? "Creating…" : "Create"}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Rename playlist" open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)}>
        <form className="modalForm" onSubmit={handleRenamePlaylist}>
          <Field label="Playlist name" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Playlist name" autoFocus />
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setRenameTarget(null)}>Cancel</button>
            <button type="submit" className="primaryButton" disabled={actionBusy || !draftName.trim()}>{actionBusy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Delete playlist" open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <div className="modalForm">
          <p className="mutedText">Delete <strong>{deleteTarget?.name}</strong>?</p>
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button type="button" className="primaryButton primaryButton--danger" onClick={handleDeletePlaylist} disabled={actionBusy}>{actionBusy ? "Deleting…" : "Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
