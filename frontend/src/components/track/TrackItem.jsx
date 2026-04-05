

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { useNavigate } from "react-router-dom";
import CoverArt from "../media/CoverArt.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function TrackItem({ track, onPlay, isLiked, onToggleLike, onRemove }) {
  const nav = useNavigate();
  const { t } = useI18n();

  const title = track?.title || "";
  const artist = track?.artist?.name || "";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="track-item">
      <CoverArt src={track?.coverUrl} title={title} className="track-cover" />

      <div className="track-info">
        <button
          className="track-title"
          onClick={() => nav(`/app/track/${track.id}`)}
          title={t("track.open")}
          type="button"
        >
          {title}
        </button>

        <div className="track-meta">{artist}</div>
      </div>

      <div className="track-right">
        {track?.playsCount != null ? t("track.playsCount", { count: track.playsCount }) : ""}
      </div>

      <div className="track-actions">
        <button className="btn track-item__play" onClick={onPlay} title={t("track.play")} type="button">
          <span className="track-item__glyph track-item__glyph--play">▶</span>
        </button>

        <button
          className="btn track-item__like"
          onClick={onToggleLike}
          title={t("track.favorite")}
          type="button"
        >
          <span className="track-item__glyph track-item__glyph--like">
            {isLiked ? "♥" : "♡"}
          </span>
        </button>

        {typeof onRemove === "function" ? (
          <button
            className="btn track-item__remove"
            onClick={onRemove}
            title={t("track.removeFromPlaylist")}
            aria-label={t("track.removeFromPlaylist")}
            type="button"
          >
            <span className="track-item__glyph track-item__glyph--remove">✕</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
