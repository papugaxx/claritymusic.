

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { getLikedTracks } from "../services/api.js";
import { Surface } from "../ui/Surface.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { SelectField } from "../ui/SelectField.jsx";
import { TrackRow } from "../ui/TrackRow.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function LikedPage() {
  const { playTrack, toggleLike, isLiked, likesVersion, isShuffled, toggleShuffle } = usePlayer();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLikedTracks({ take: 100, skip: 0 }).then((response) => {
      if (!alive) return;
      const nextItems = response.ok ? response.data.items || [] : [];
      setItems(nextItems);
      setTotalCount(response.ok ? Number(response.data.totalCount || nextItems.length) : 0);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [likesVersion]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((left, right) => {
      if (sortBy === "date_asc") return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
      if (sortBy === "plays_desc") return Number(right.playsCount || 0) - Number(left.playsCount || 0);
      if (sortBy === "duration_desc") return Number(right.durationSec || 0) - Number(left.durationSec || 0);
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
    return list;
  }, [items, sortBy]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="pageHero pageHero--playlist">
        <div className="pageHero__identity">
          <span className="likedCoverHero"><span>♥</span></span>
          <div>
            <h1>Liked tracks</h1>
            <p>Tracks: {totalCount}</p>
            <span>Your saved tracks are collected here.</span>
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
                { value: "date_desc", label: "Newest first" },
                { value: "date_asc", label: "Oldest first" },
                { value: "plays_desc", label: "Most played" },
                { value: "duration_desc", label: "Longest first" },
              ]}
            />
          </div>
          <button type="button" className="ghostButton" onClick={() => sortedItems.length && playTrack(sortedItems[0], sortedItems)} disabled={!sortedItems.length}>Play</button>
          <button type="button" className={`actionButton ${isShuffled ? "is-active" : ""}`.trim()} onClick={toggleShuffle} disabled={!sortedItems.length}>⇄</button>
        </div>
      </Surface>

      <Surface className="listSurface">
        {loading ? <div className="emptyState">Loading…</div> : null}
        {!loading && sortedItems.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            onPlay={() => playTrack(track, sortedItems)}
            onToggleLike={() => toggleLike(track.id)}
            isLiked={isLiked(track.id)}
          />
        ))}
        {!loading && !sortedItems.length ? <div className="emptyState">No liked tracks yet.</div> : null}
      </Surface>
    </div>
  );
}
