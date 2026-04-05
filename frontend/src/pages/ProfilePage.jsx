

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLikedTracks } from "../services/api.js";
import { getMeProfile, getMyFollowing, getPlaylistsPage, updateProfile, uploadAvatar } from "../services/profileApi.js";
import { Surface } from "../ui/Surface.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Field } from "../ui/Field.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ProfilePage() {
  const { me, refreshMe } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [following, setFollowing] = useState([]);
  const [likedCount, setLikedCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    getMeProfile().then((response) => {
      if (!alive || !response.ok) return;
      setProfile(response.data);
      setDisplayName(response.data.displayName || "");
    });
    getPlaylistsPage({ take: 20, skip: 0 }).then((response) => {
      if (!alive) return;
      setPlaylists(response.ok ? response.data.items || [] : []);
    });
    getMyFollowing({ take: 20, skip: 0 }).then((response) => {
      if (!alive) return;
      setFollowing(response.ok ? response.data.items || [] : []);
    });
    getLikedTracks({ take: 1, skip: 0 }).then((response) => {
      if (!alive) return;
      setLikedCount(response.ok ? Number(response.data.totalCount || 0) : 0);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  async function handleSaveProfile() {
    setBusy(true);
    setMessage("");
    let avatarUrl = profile?.avatarUrl || "";
    if (file) {
      const upload = await uploadAvatar(file);
      if (!upload.ok) {
        setBusy(false);
        setMessage(upload.error || "Failed to upload avatar");
        return;
      }
      avatarUrl = upload.data?.avatarUrl || upload.data?.url || avatarUrl;
    }

    const response = await updateProfile({ displayName, avatarUrl });
    setBusy(false);
    if (!response.ok) {
      setMessage(response.error || "Failed to update profile");
      return;
    }

    setProfile(response.data);
    setOpen(false);
    setFile(null);
    setPreviewUrl("");
    setMessage("");
    await refreshMe();
  }

  const effectiveName = profile?.displayName || me?.displayName || me?.name || "tc";
  const avatarSource = previewUrl || profile?.avatarUrl || me?.avatarUrl || "";
  const artistMode = Boolean(profile?.isArtist ?? me?.isArtist);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const statCards = useMemo(() => ([
    { label: "Liked collection", value: likedCount, hint: "Saved tracks for quick starts and mixes." },
    { label: "Playlists", value: playlists.length, hint: "Library overview" },
    { label: "Following", value: following.length, hint: "Artists you follow right now." },
  ]), [likedCount, playlists.length, following.length]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="profileHero">
        <div className="profileHero__main">
          <span className="badge">YOUR PROFILE</span>
          <div className="profileHero__user">
            <AvatarArt src={avatarSource} name={effectiveName} className="profileHero__avatar" />
            <div className="profileHero__details">
              <h1>{effectiveName}</h1>
              <p>{me?.email}</p>
              <div className="chipRow chipRow--tight">
                <span className="miniChip">{playlists.length} Playlists</span>
                <span className="miniChip">{likedCount} Liked tracks</span>
                <span className="miniChip">{following.length} Following</span>
              </div>
              <div className="buttonRow">
                <button type="button" className="ghostButton" onClick={() => setOpen(true)}>Edit profile</button>
                {artistMode ? <Link to="/app/artist/studio" className="ghostButton ghostButton--link">Artist Studio</Link> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="profileHero__sideCards">
          <div className="profileInfoCard surfaceCardLike"><span>Library overview</span><strong>{likedCount > 0 ? "Keep the mix going" : "Start liking tracks"}</strong></div>
        </div>
      </Surface>

      <div className="profileGrid">
        <Surface className="profileSection">
          <h2>Overview</h2>
          <p>Your main music space</p>
          <div className="statsGrid">
            {statCards.map((card) => (
              <div key={card.label} className="statCard">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="profileSection">
          <h2>Playlists</h2>
          <p>Your playlists for quick access.</p>
          <div className="profileMiniList">
            {playlists.length ? playlists.map((playlist) => (
              <Link key={playlist.id} className="profileMiniList__item" to={`/app/playlist/${playlist.id}`}>
                <CoverArt src={playlist.coverUrl} title={playlist.name} className="profileMiniList__cover" />
                <span>
                  <strong>{playlist.name}</strong>
                  <small>playlist</small>
                </span>
              </Link>
            )) : <div className="emptyState">No playlists yet</div>}
          </div>
        </Surface>

        <Surface className="profileSection profileSection--wide">
          <div className="sectionHeaderRow">
            <div>
              <h2>Recently liked</h2>
              <p>Quick access to what you want to play again</p>
            </div>
            <Link to="/app/liked" className="ghostButton ghostButton--link">Open all</Link>
          </div>
          <div className="emptyState">No liked tracks yet.</div>
        </Surface>

        <Surface className="profileSection">
          <h2>Following artists</h2>
          <p>People whose releases matter to you</p>
          {following.length ? following.map((artist) => (
            <Link key={artist.artistId} className="profileMiniList__item" to={`/app/artists/${artist.artistId}`}>
              <AvatarArt src={artist.avatarUrl} name={artist.artistName} className="profileMiniList__avatar" />
              <span>
                <strong>{artist.artistName}</strong>
                <small>artist</small>
              </span>
            </Link>
          )) : <div className="emptyState">No follows yet</div>}
        </Surface>
      </div>

      <Modal title="Edit profile" open={open} onClose={() => setOpen(false)}>
        <div className="profileModal">
          <div className="profileModal__intro mutedText">Change only your name and avatar.</div>

          <div className="profileModal__side">
            <AvatarArt src={avatarSource} name={effectiveName} shape="square" className="profileModal__avatar" />
            <p>JPG, PNG, or WEBP. The image will appear in your profile and menu.</p>
            <label className="secondaryButton secondaryButton--full profileModal__uploadButton">
              Upload avatar
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="profileModal__main">
            <Field label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            {message ? <div className="inlineMessage inlineMessage--error">{message}</div> : null}
          </div>
        </div>

        <div className="buttonRow buttonRow--end profileModal__actions">
          <button type="button" className="ghostButton" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="primaryButton" onClick={handleSaveProfile} disabled={busy || !displayName.trim()}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </Modal>
    </div>
  );
}
