

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { followArtist, getArtist, getArtistTracks, unfollowArtist } from "../services/api.js";
import { Surface } from "../ui/Surface.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";
import { TrackRow } from "../ui/TrackRow.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
  return String(numeric);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const { playTrack, toggleLike, isLiked } = usePlayer();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getArtist(id), getArtistTracks(id, { take: 12, skip: 0 })]).then(([artistResponse, tracksResponse]) => {
      if (!alive) return;
      if (artistResponse.ok) {
        setArtist(artistResponse.data);
        setFollowing(Boolean(artistResponse.data.isFollowing));
      } else {
        setArtist(null);
      }
      setTracks(tracksResponse.ok ? tracksResponse.data.items || [] : []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const topTrack = tracks[0] || null;
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const totalPlays = useMemo(() => tracks.reduce((sum, track) => sum + Number(track.playsCount || 0), 0), [tracks]);

  async function handleFollowToggle() {
    if (!artist?.id) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }
    const response = following ? await unfollowArtist(artist.id) : await followArtist(artist.id);
    if (!response?.ok) return;
    setFollowing(!following);
    setArtist((current) => current ? { ...current, followersCount: response.data.followersCount } : current);
  }

  if (loading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="pageStack"><Surface className="listSurface"><div className="emptyState">Loading…</div></Surface></div>;
  }

  if (!artist) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="pageStack"><Surface className="listSurface"><div className="emptyState">Artist not found.</div></Surface></div>;
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="artistHero">
        <div className="artistHero__main">
          <AvatarArt src={artist.avatarUrl} name={artist.name} className="artistHero__avatar" />
          <div className="artistHero__copy">
            <span className="badge">ARTIST PROFILE</span>
            <h1>{artist.name}</h1>
            <p>{artist.followersCount || 0} followers · {tracks.length} tracks</p>
            <div className="chipRow chipRow--tight">
              <span className="miniChip">{artist.followersCount || 0} Followers</span>
              <span className="miniChip">{tracks.length} Tracks</span>
              <span className="miniChip">{topTrack?.title || "Track"} Top track</span>
              <span className="miniChip">{formatCompactNumber(topTrack?.playsCount || totalPlays)} Plays</span>
            </div>
            <button type="button" className="ghostButton" onClick={handleFollowToggle}>{following ? "Following" : "Follow"}</button>
          </div>
        </div>

        <div className="artistHero__side">
          <div className="profileInfoCard surfaceCardLike"><span>Spotlight</span><strong>{topTrack?.title || "Track"}</strong></div>
          <div className="profileInfoCard surfaceCardLike"><span>Status</span><strong>Available to follow</strong></div>
        </div>
      </Surface>

      <div className="artistGrid">
        <Surface className="profileSection">
          <h2>Popular tracks</h2>
          <p>Best tracks from the artist in one clean list.</p>
          <div className="listSurface listSurface--flat">
            {tracks.length ? tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onPlay={() => playTrack(track, tracks)}
                onToggleLike={() => toggleLike(track.id)}
                isLiked={isLiked(track.id)}
              />
            )) : <div className="emptyState">No active tracks yet.</div>}
          </div>
        </Surface>

        <Surface className="profileSection">
          <h2>About the artist</h2>
          <p>Public artist profile with core releases and stats.</p>
          <div className="creditRow"><span>Followers</span><strong>{artist.followersCount || 0}</strong></div>
          <div className="creditRow"><span>Total plays</span><strong>{formatCompactNumber(totalPlays)}</strong></div>
        </Surface>

        <Surface className="profileSection">
          <h2>Recommended tracks</h2>
          <p>A short selection of standout releases.</p>
          {tracks.slice(0, 3).map((track) => (
            <div key={track.id} className="profileMiniList__item">
              <AvatarArt src={artist.avatarUrl} name={artist.name} className="profileMiniList__avatar" />
              <span>
                <strong>{track.title}</strong>
                <small>{track.genreName || track.moodName || "Track"}</small>
              </span>
            </div>
          ))}
          {!tracks.length ? <div className="emptyState">No releases yet.</div> : null}
        </Surface>
      </div>
    </div>
  );
}
