

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { useNavigate } from "react-router-dom";
import CoverArt from "../media/CoverArt.jsx";
import { usePlayerActions, usePlayerQueueState, usePlayerTransportState } from "../../context/PlayerContext.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function PlayGlyph() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 6.4v11.2c0 .8.9 1.28 1.58.84l8.06-5.6a1 1 0 0 0 0-1.64L9.58 5.56A1 1 0 0 0 8 6.4Z" fill="currentColor" />
    </svg>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function PauseGlyph() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" />
    </svg>
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function TrackTileCard({ track, queue = null, subtitle = "", coverUrl = null }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const p = usePlayerActions();
  const { currentTrack } = usePlayerQueueState();
  const { isPlaying, loading } = usePlayerTransportState();

  if (!track) return null;

  const isCurrentTrack = Number(currentTrack?.id) === Number(track.id);
  const isCurrentPlaying = isCurrentTrack && !!isPlaying;
  const title = track.title || t("track.titleFallback");
  const subtitleText = subtitle || track.artist?.name || track.artistName || "";

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function openTrack() {
    navigate(`/app/track/${track.id}`);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function handlePlay(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (loading || !track) return;

    if (isCurrentTrack) {
      void p.togglePlayPause();
      return;
    }

    void p.playTrack(track, Array.isArray(queue) && queue.length ? queue : [track]);
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <article className="tile tile--track tile--trackInteractive">
      <div className="tile__mediaWrap">
        <button
          className="tile__open"
          type="button"
          onClick={openTrack}
          title={title}
          aria-label={`${t("track.open")} ${title}`.trim()}
        >
          <CoverArt src={coverUrl ?? track.coverUrl} title={title} className="tile__media" />
        </button>

        <button
          className={`tile__play tile__playButton${isCurrentPlaying ? " is-playing" : ""}`}
          type="button"
          aria-label={isCurrentPlaying ? t("track.pause") : t("track.play")}
          title={isCurrentPlaying ? t("track.pause") : t("track.play")}
          onClick={handlePlay}
          disabled={loading}
        >
          <span className="tile__playGlyph" aria-hidden="true">
            {isCurrentPlaying ? <PauseGlyph /> : <PlayGlyph />}
          </span>
        </button>
      </div>

      <button className="tile__body tile__bodyButton" type="button" onClick={openTrack}>
        <div className="tile__title" title={title}>{title}</div>
        <div className="tile__sub" title={subtitleText}>{subtitleText}</div>
      </button>
    </article>
  );
}
