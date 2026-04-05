

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link } from "react-router-dom";
import { CoverArt } from "./CoverArt.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function formatPlays(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return String(numeric);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function TrackRow({
  track,
  onPlay,
  onToggleLike,
  onRemove,
  isLiked = false,
  removeLabel = "Remove",
}) {
  if (!track) return null;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="trackRow surfaceCardLike">
      <div className="trackRow__main">
        <CoverArt src={track.coverUrl} title={track.title} className="trackRow__cover" />
        <div className="trackRow__text">
          <Link to={`/app/track/${track.id}`} className="trackRow__title">
            {track.title}
          </Link>
          <div className="trackRow__artist">{track.artistName || track.artist?.name || "—"}</div>
        </div>
      </div>

      <div className="trackRow__plays">{formatPlays(track.playsCount)}</div>

      <div className="trackRow__actions">
        <button type="button" className="actionButton actionButton--small" onClick={onPlay} aria-label="Play track">
          ▶
        </button>
        <button type="button" className={`actionButton actionButton--small ${isLiked ? "is-active" : ""}`} onClick={onToggleLike} aria-label="Toggle like">
          {isLiked ? "♥" : "♡"}
        </button>
        {typeof onRemove === "function" ? (
          <button type="button" className="actionButton actionButton--small" onClick={onRemove} aria-label={removeLabel}>
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
