

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import TrackTileCard from "../components/track/TrackTileCard.jsx";
import ProfileHeroCard from "../components/profile/ProfileHeroCard.jsx";
import EditProfileModal from "../components/profile/EditProfileModal.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useAppState } from "../context/AppStateContext.jsx";
import { isAdmin, isArtist } from "../utils/auth.js";
import { useProfileData } from "../hooks/useProfileData.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function pickName(me) {
  return me?.displayName || me?.name || me?.username || me?.userName || (me?.email ? String(me.email).split("@")[0] : "Profile");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function fmtSec(sec) {
  const s = Number(sec || 0);
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getTrackArtistName(track) {
  return track?.artist?.name || track?.artistName || "Unknown artist";
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Profile() {
  const { me, loading, refreshMe } = useAuth();
  const { t } = useI18n();
  const { likesVersion, playlistsVersion, tracksVersion, lastPlayEvent } = useAppState();
  
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const isArtistAccount = useMemo(() => isArtist(me), [me]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const hasAdminAccess = useMemo(() => isAdmin(me), [me]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [profileOpen, setProfileOpen] = useState(false);

  const refreshKey = `${likesVersion}:${playlistsVersion}:${tracksVersion}`;
  const {
    busy,
    error,
    profile,
    playlists,
    liked,
    following,
    sections,
    reload,
    setProfile,
  } = useProfileData({
    enabled: !!me?.isAuthenticated,
    refreshKey,
    loadErrorMessage: t("profile.loadError"),
  });

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const patchedLiked = useMemo(() => {
    if (!lastPlayEvent?.trackId) return liked;
    return liked.map((track) => (
      track.id === lastPlayEvent.trackId
        ? { ...track, playsCount: Number.isFinite(Number(lastPlayEvent.playsCount)) ? Number(lastPlayEvent.playsCount) : track.playsCount }
        : track
    ));
  }, [liked, lastPlayEvent]);

  const name = profile.displayName || pickName(me);
  const profileAvatar = profile.avatarUrl || me?.avatarUrl || me?.avatar || "";
  const ownPlaylists = playlists;
  const likedHighlights = patchedLiked.slice(0, 6);
  const topTracks = patchedLiked.slice(0, 8);
  const followingHighlights = following.slice(0, 6);

  if (loading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="sp-page sp-page--profile"><div className="sp-card sp-section">{t("profile.loading")}</div></div>;
  }
  if (!me?.isAuthenticated) return null;

  const heroStats = [
    { label: t("profile.playlists"), value: ownPlaylists.length },
    { label: t("profile.likedTracks"), value: patchedLiked.length },
    { label: t("profile.following"), value: following.length },
  ];

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function renderSectionWarning(section) {
    if (!section?.error) return null;
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="sp-bannerError">⚠ {section.error}</div>;
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function renderSectionEmpty(section, emptyText) {
    if (section?.error && !section?.loaded) return <div className="sp-empty">⚠ {section.error}</div>;
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="sp-empty">{emptyText}</div>;
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="sp-page sp-page--profile">
      <ProfileHeroCard
        badge={t("profile.badge")}
        title={name}
        subtitle={me?.email || t("profile.musicSpace")}
        avatarSrc={profileAvatar}
        avatarName={name}
        stats={heroStats}
        actions={
          <>
            <button className="sp-btn sp-btn--ghost" type="button" onClick={() => setProfileOpen(true)}>
              {t("profile.editProfile")}
            </button>
            {isArtistAccount ? (
              <Link className="sp-btn sp-btn--primary" to="/app/artist/studio">
                {t("profile.artistStudio")}
              </Link>
            ) : null}
            {hasAdminAccess ? (
              <Link className="sp-btn sp-btn--primary" to="/admin/tracks">
                {t("common.adminPanel")}
              </Link>
            ) : null}
          </>
        }
        meta={
          <div className="sp-metaStack sp-metaStack--profile">
            <div className="sp-metaCard">
              <div className="sp-metaCard__label">{t("profile.libraryOverview")}</div>
              <div className="sp-metaCard__value">{patchedLiked.length ? t("profile.tracksSaved", { count: patchedLiked.length }) : t("profile.startLiking")}</div>
            </div>
          </div>
        }
      />

      {error ? <div className="sp-bannerError">⚠ {error}</div> : null}
      {busy ? <div className="sp-loadingLine">{t("profile.loadingData")}</div> : null}

      <div className="sp-profileLayout">
        <div className="sp-profileMain">
          <section className="sp-card sp-section">
            <div className="sp-section__head">
              <div>
                <div className="sp-h">{t("profile.overview")}</div>
                <div className="sp-section__sub">{t("profile.overviewSub")}</div>
              </div>
            </div>

            <div className="sp-metricGrid">
              <article className="sp-metricCard"><div className="sp-metricCard__label">{t("profile.likedCollection")}</div><div className="sp-metricCard__value">{patchedLiked.length}</div><div className="sp-metricCard__sub">{t("profile.likedCollectionSub")}</div></article>
              <article className="sp-metricCard"><div className="sp-metricCard__label">{t("profile.playlists")}</div><div className="sp-metricCard__value">{ownPlaylists.length}</div><div className="sp-metricCard__sub">{t("profile.libraryOverview")}</div></article>
              <article className="sp-metricCard"><div className="sp-metricCard__label">{t("profile.following")}</div><div className="sp-metricCard__value">{following.length}</div><div className="sp-metricCard__sub">{t("profile.followingSub")}</div></article>
            </div>
          </section>

          <section className="sp-card sp-section">
            <div className="sp-section__head">
              <div><div className="sp-h">{t("profile.recentlyLiked")}</div><div className="sp-section__sub">{t("profile.recentlyLikedSub")}</div></div>
              <div className="sp-head-actions"><Link className="sp-btn sp-btn--ghost" to="/app/liked">{t("profile.openAll")}</Link></div>
            </div>
            {sections.liked.error && likedHighlights.length > 0 ? renderSectionWarning(sections.liked) : null}
            {likedHighlights.length === 0 ? renderSectionEmpty(sections.liked, t("profile.noLikedTracks")) : (
              <div className="sp-cards sp-cards--compact">
                {likedHighlights.map((track) => (
                  <TrackTileCard
                    key={track.id}
                    track={track}
                    queue={likedHighlights}
                    subtitle={getTrackArtistName(track)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="sp-card sp-section">
            <div className="sp-section__head"><div><div className="sp-h">{t("profile.topLikedTracks")}</div><div className="sp-section__sub">{t("profile.topLikedTracksSub")}</div></div></div>
            {sections.liked.error && topTracks.length > 0 ? renderSectionWarning(sections.liked) : null}
            {topTracks.length === 0 ? renderSectionEmpty(sections.liked, t("profile.noTracks")) : (
              <div className="sp-trackListModern">
                {topTracks.map((track, index) => (
                  <Link key={track.id} to={`/app/track/${track.id}`} className="sp-trackRowModern">
                    <div className="sp-trackRowModern__index">{index + 1}</div>
                    <CoverArt src={track.coverUrl} title={track.title} className="sp-trackRowModern__cover" />
                    <div className="sp-trackRowModern__main"><div className="sp-trackRowModern__title">{track.title}</div><div className="sp-trackRowModern__meta">{getTrackArtistName(track)}</div></div>
                    <div className="sp-trackRowModern__side">{fmtSec(track.durationSec)}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sp-profileSide">
          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact"><div><div className="sp-h">{t("profile.playlists")}</div><div className="sp-section__sub">{t("profile.playlistsSub")}</div></div></div>
            {sections.playlists.error && ownPlaylists.length > 0 ? renderSectionWarning(sections.playlists) : null}
            {ownPlaylists.length === 0 ? renderSectionEmpty(sections.playlists, t("profile.noPlaylists")) : (
              <div className="sp-miniTrackList">
                {ownPlaylists.slice(0, 4).map((playlist) => (
                  <Link key={playlist.id} className="sp-miniTrack" to={`/app/playlist/${playlist.id}`}>
                    <CoverArt src={playlist.coverUrl} title={playlist.name} className="sp-miniTrack__cover" />
                    <div className="sp-miniTrack__main"><div className="sp-miniTrack__title">{playlist.name}</div><div className="sp-miniTrack__meta">{t("profile.playlistMeta")}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact"><div><div className="sp-h">{t("profile.followingArtists")}</div><div className="sp-section__sub">{t("profile.followingArtistsSub")}</div></div></div>
            {sections.following.error && followingHighlights.length > 0 ? renderSectionWarning(sections.following) : null}
            {followingHighlights.length === 0 ? renderSectionEmpty(sections.following, t("profile.noFollowing")) : (
              <div className="sp-compactList">
                {followingHighlights.map((artist) => (
                  <Link key={artist.artistId} className="sp-personCard" to={`/app/artists/${artist.artistId}`}>
                    <ArtistAvatar className="sp-personCard__avatar" src={artist.avatarUrl} name={artist.artistName} />
                    <div className="sp-personCard__main"><div className="sp-personCard__title">{artist.artistName}</div><div className="sp-personCard__meta">{t("profile.artistMeta")}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <EditProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        me={{ ...me, ...profile }}
        onSaved={async (data) => {
          setProfile((prev) => ({
            displayName: data?.displayName || prev.displayName,
            avatarUrl: data?.avatarUrl ?? "",
          }));
          setProfileOpen(false);
          await refreshMe?.();
          const controller = new AbortController();
          await reload(controller.signal);
        }}
      />
    </div>
  );
}
