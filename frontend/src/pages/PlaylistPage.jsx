

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlaylist, removeTrackFromPlaylist } from "../services/api.js";
import { Surface } from "../ui/Surface.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { SelectField } from "../ui/SelectField.jsx";
import { TrackRow } from "../ui/TrackRow.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlaylistPage() {
  const { id } = useParams();
  const { playTrack, toggleLike, isLiked, isShuffled, toggleShuffle } = usePlayer();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playlist, setPlaylist] = useState(null);
  const [sortBy, setSortBy] = useState("added_desc");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPlaylist(id, { take: 200, skip: 0, sort: sortBy }).then((response) => {
      if (!alive) return;
      setPlaylist(response.ok ? response.data : null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id, sortBy]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const items = useMemo(() => playlist?.tracks?.items || [], [playlist]);
  const totalCount = Number(playlist?.tracks?.totalCount || items.length || 0);

  async function handleRemoveTrack(trackId) {
    const response = await removeTrackFromPlaylist(id, trackId);
    if (!response?.ok) {
      setMessage(response?.error || "Failed to remove track");
      return;
    }
    setPlaylist((current) => {
      if (!current) return current;
      const nextItems = (current.tracks?.items || []).filter((track) => Number(track.id) !== Number(trackId));
      return {
        ...current,
        tracks: {
          ...current.tracks,
          items: nextItems,
          totalCount: Math.max(0, Number(current.tracks?.totalCount || nextItems.length) - 1),
        },
      };
    });
    setMessage("");
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="pageHero pageHero--playlist">
        <div className="pageHero__identity">
          <CoverArt src={playlist?.coverUrl} title={playlist?.name || "Playlist"} className="pageHero__cover" />
          <div>
            <h1>{playlist?.name || "Playlist"}</h1>
            <p>Tracks: {totalCount}</p>
            <span>Rename, cover and delete controls are available in My Library on the left.</span>
          </div>
        </div>

        <div className="pageHero__actions pageHero__actions--playlist">
          <div className="sortCluster">
            <span>Sort:</span>
            <SelectField
              value={sortBy}
              onChange={setSortBy}
              placeholder={null}
              options={[
                { value: "added_desc", label: "Recently added first" },
                { value: "added_asc", label: "Oldest added first" },
                { value: "track_date_desc", label: "Newest release" },
                { value: "plays_desc", label: "Most played" },
                { value: "duration_desc", label: "Longest first" },
              ]}
            />
          </div>
          <button type="button" className="ghostButton" onClick={() => items.length && playTrack(items[0], items)} disabled={!items.length}>Play</button>
          <button type="button" className={`actionButton ${isShuffled ? "is-active" : ""}`.trim()} onClick={toggleShuffle} disabled={!items.length}>⇄</button>
        </div>
      </Surface>

      <Surface className="listSurface">
        {loading ? <div className="emptyState">Loading…</div> : null}
        {!loading && message ? <div className="inlineMessage inlineMessage--error">{message}</div> : null}
        {!loading && items.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            onPlay={() => playTrack(track, items)}
            onToggleLike={() => toggleLike(track.id)}
            onRemove={() => handleRemoveTrack(track.id)}
            isLiked={isLiked(track.id)}
            removeLabel="Remove from playlist"
          />
        ))}
        {!loading && !items.length ? <div className="emptyState">This playlist does not have tracks yet.</div> : null}
      </Surface>
    </div>
  );
}
