

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { followArtist, getArtist, getArtistTracks, unfollowArtist } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import ProfileHeroCard from "../components/profile/ProfileHeroCard.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";

const TRACKS_PAGE_SIZE = 24;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function fmtSec(sec) {
  const s = Number(sec || 0);
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
function formatCompactPlays(value) {
  const n = Number(value || 0);
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ArtistPublic() {
  const { id } = useParams();
  const artistId = Number(id);
  const nav = useNavigate();
  const { me, loading } = useAuth();
  const { t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    notFound: t("artistPublic.notFound"),
    actionFailed: t("artistPublic.actionFailed"),
    loading: t("artistPublic.loading"),
    badge: t("artistPublic.badge"),
    titleFallback: t("artistPublic.titleFallback"),
    subtitle: (followers, tracks) => t("artistPublic.subtitle", { followers, tracks }),
    followers: t("artistPublic.followers"),
    tracks: t("artistPublic.tracks"),
    topTrack: t("artistPublic.topTrack"),
    plays: t("artistPublic.plays"),
    follow: t("artistPublic.follow"),
    following: t("artistPublic.following"),
    mainTrackLabel: t("artistPublic.mainTrackLabel"),
    noTracksYet: t("artistPublic.noTracksYet"),
    status: t("artistPublic.status"),
    availableToFollow: t("artistPublic.availableToFollow"),
    popularTracks: t("artistPublic.popularTracks"),
    popularTracksSub: t("artistPublic.popularTracksSub"),
    tracksEmpty: t("artistPublic.tracksEmpty"),
    trackPlays: (count) => t("artistPublic.trackPlays", { count: formatCompactPlays(count) }),
    aboutArtist: t("artistPublic.aboutArtist"),
    aboutArtistText: t("artistPublic.aboutArtistText"),
    totalPlays: t("artistPublic.totalPlays"),
    recommended: t("artistPublic.recommended"),
    recommendedSub: t("artistPublic.recommendedSub"),
    recommendedEmpty: t("artistPublic.recommendedEmpty"),
    loadTracksFailed: t("artistPublic.loadTracksFailed"),
  }), [t]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pageBusy, setPageBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tracksStatus, setTracksStatus] = useState("idle");
  const [tracksError, setTracksError] = useState("");
  const [hasMoreTracks, setHasMoreTracks] = useState(false);
  const [_tracksNextSkip, setTracksNextSkip] = useState(0);
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const artistRequestIdRef = useRef(0);
  const tracksRequestIdRef = useRef(0);
  const tracksNextSkipRef = useRef(0);

  const authed = !!me?.isAuthenticated;

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadArtistProfile = useCallback(async () => {
    if (!Number.isFinite(artistId) || artistId <= 0) return;
    const requestId = artistRequestIdRef.current + 1;
    artistRequestIdRef.current = requestId;

    setErr("");
    setPageBusy(true);

    try {
      const artistRes = await getArtist(artistId);
      if (artistRequestIdRef.current !== requestId) return;

      if (!artistRes.ok) {
        setArtist(null);
        setTracks([]);
        setFollowing(false);
        setErr(artistRes.error || text.notFound);
        return;
      }

      const nextArtist = artistRes.data;
      setArtist(nextArtist);
      setFollowing(!!nextArtist?.isFollowing);
    } catch {
      if (artistRequestIdRef.current === requestId) {
        setArtist(null);
        setTracks([]);
        setFollowing(false);
        setErr(text.notFound);
      }
    } finally {
      if (artistRequestIdRef.current === requestId) setPageBusy(false);
    }
  }, [artistId, text.notFound]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTracksPage = useCallback(async ({ append = false } = {}) => {
    if (!Number.isFinite(artistId) || artistId <= 0) return;
    const requestId = tracksRequestIdRef.current + 1;
    tracksRequestIdRef.current = requestId;

    if (!append) {
      tracksNextSkipRef.current = 0;
      setTracksNextSkip(0);
      setTracksStatus("loading");
      setTracksError("");
    } else {
      setLoadingMoreTracks(true);
      setTracksError("");
    }

    const skip = append ? tracksNextSkipRef.current : 0;

    try {
      const tracksRes = await getArtistTracks(artistId, { take: TRACKS_PAGE_SIZE, skip });
      if (tracksRequestIdRef.current !== requestId) return;

      if (!tracksRes.ok) {
        if (!append) {
          tracksNextSkipRef.current = 0;
          setTracks([]);
          setHasMoreTracks(false);
          setTracksNextSkip(0);
          setTracksStatus("hard-error");
        }
        setTracksError(tracksRes.error || text.loadTracksFailed);
        return;
      }

      const page = tracksRes.data || {};
      const nextItems = Array.isArray(page.items) ? page.items : [];
      const resolvedNextSkip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : skip + nextItems.length;
      tracksNextSkipRef.current = resolvedNextSkip;
      setTracks((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setHasMoreTracks(!!page.hasMore);
      setTracksNextSkip(resolvedNextSkip);
      setTracksStatus(nextItems.length > 0 || append || skip > 0 ? "success" : "empty");
    } catch (e) {
      if (tracksRequestIdRef.current !== requestId) return;
      if (!append) {
        tracksNextSkipRef.current = 0;
        setTracks([]);
        setHasMoreTracks(false);
        setTracksNextSkip(0);
        setTracksStatus("hard-error");
      }
      setTracksError(e?.message || text.loadTracksFailed);
    } finally {
      if (tracksRequestIdRef.current === requestId) setLoadingMoreTracks(false);
    }
  }, [artistId, text.loadTracksFailed]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!Number.isFinite(artistId) || artistId <= 0 || loading) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadArtistProfile();
      void loadTracksPage({ append: false });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (cancelled) {
        artistRequestIdRef.current += 1;
        tracksRequestIdRef.current += 1;
      }
    };
  }, [artistId, loading, loadArtistProfile, loadTracksPage]);

  
  async function onToggleFollow() {
    if (!authed) {
      nav("/login");
      return;
    }

    setBusy(true);
    setErr("");
    const wasFollowing = following;
    const res = wasFollowing ? await unfollowArtist(artistId) : await followArtist(artistId);

    if (!res.ok) {
      setErr(res.error || text.actionFailed);
      setBusy(false);
      return;
    }

    const nextFollowing = !!res.data?.followed;
    const nextFollowers = Number(res.data?.followersCount ?? artist?.followersCount ?? 0);
    setFollowing(nextFollowing);
    setArtist((prev) => prev ? { ...prev, followersCount: nextFollowers } : prev);
    setBusy(false);
  }

  if (err) return <div className="sp-page sp-page--profile"><div className="sp-card sp-section">⚠ {err}</div></div>;
  if (pageBusy || !artist) return <div className="sp-page sp-page--profile"><div className="sp-card sp-section">{text.loading}</div></div>;

  const followersCount = Number(artist.followersCount ?? 0);
  const tracksCount = Number(artist.tracksCount ?? tracks.length ?? 0);
  const totalPlays = tracks.reduce((sum, track) => sum + Number(track?.playsCount || 0), 0);
  const topTracks = [...tracks].sort((a, b) => Number(b?.playsCount || 0) - Number(a?.playsCount || 0)).slice(0, 6);
  const mainTrack = topTracks[0] || null;
  const ownArtist = !!artist.isOwnedByCurrentUser;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="sp-page sp-page--profile">
      <ProfileHeroCard
        badge={text.badge}
        title={artist.name || text.titleFallback}
        subtitle={text.subtitle(followersCount, tracksCount)}
        avatarSrc={artist.avatarUrl}
        avatarName={artist.name}
        coverSrc={artist.coverUrl}
        stats={[
          { label: text.followers, value: followersCount },
          { label: text.tracks, value: tracksCount },
          { label: text.topTrack, value: mainTrack?.title || "—" },
          { label: text.plays, value: formatCompactPlays(totalPlays) },
        ]}
        actions={ownArtist ? null : (
          <button className="sp-btn sp-btn--primary" onClick={onToggleFollow} disabled={busy}>
            {following ? text.following : text.follow}
          </button>
        )}
        meta={<div className="sp-metaStack sp-metaStack--profile"><div className="sp-metaCard"><div className="sp-metaCard__label">{text.mainTrackLabel}</div><div className="sp-metaCard__value">{mainTrack?.title || text.noTracksYet}</div></div><div className="sp-metaCard"><div className="sp-metaCard__label">{text.status}</div><div className="sp-metaCard__value">{ownArtist ? text.titleFallback : following ? text.following : text.availableToFollow}</div></div></div>}
      />

      <div className="sp-profileLayout">
        <div className="sp-profileMain">
          <section className="sp-card sp-section">
            <div className="sp-section__head"><div><div className="sp-h">{text.popularTracks}</div><div className="sp-section__sub">{text.popularTracksSub}</div></div></div>
            {tracksStatus === "loading" ? <div className="sp-empty">{text.loading}</div> : null}
            {tracksStatus === "hard-error" ? <div className="sp-empty">⚠ {tracksError || text.loadTracksFailed}</div> : null}
            {tracksStatus !== "loading" && tracksStatus !== "hard-error" && tracks.length === 0 ? <div className="sp-empty">{text.tracksEmpty}</div> : null}
            {tracks.length > 0 ? (
              <div className="sp-trackListModern">
                {tracks.map((track, index) => (
                  <Link key={track.id} to={`/app/track/${track.id}`} className="sp-trackRowModern">
                    <div className="sp-trackRowModern__index">{index + 1}</div>
                    <CoverArt src={track.coverUrl} title={track.title} className="sp-trackRowModern__cover" />
                    <div className="sp-trackRowModern__main"><div className="sp-trackRowModern__title">{track.title}</div><div className="sp-trackRowModern__meta">{text.trackPlays(track.playsCount)}</div></div>
                    <div className="sp-trackRowModern__side">{fmtSec(track.durationSec)}</div>
                  </Link>
                ))}
              </div>
            ) : null}
            {tracksError && tracks.length > 0 ? <div className="sp-empty">⚠ {tracksError}</div> : null}
            {hasMoreTracks ? (
              <div className="home__actions">
                <button className="btn" type="button" onClick={() => void loadTracksPage({ append: true })} disabled={loadingMoreTracks}>
                  {loadingMoreTracks ? t("common.loading") : t("common.loadMore")}
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="sp-profileSide">
          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact"><div><div className="sp-h">{text.aboutArtist}</div></div></div>
            <div className="sp-infoList">
              <p className="sp-infoText">{text.aboutArtistText}</p>
              <div className="sp-infoRow"><span className="sp-infoRow__label">{text.followers}</span><span className="sp-infoRow__value">{followersCount}</span></div>
              <div className="sp-infoRow"><span className="sp-infoRow__label">{text.totalPlays}</span><span className="sp-infoRow__value">{formatCompactPlays(totalPlays)}</span></div>
            </div>
          </section>

          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact"><div><div className="sp-h">{text.recommended}</div><div className="sp-section__sub">{text.recommendedSub}</div></div></div>
            {topTracks.length === 0 ? <div className="sp-empty">{text.recommendedEmpty}</div> : (
              <div className="sp-miniTrackList">
                {topTracks.slice(0, 4).map((track) => (
                  <Link key={track.id} className="sp-miniTrack" to={`/app/track/${track.id}`}>
                    <CoverArt src={track.coverUrl} title={track.title} className="sp-miniTrack__cover" />
                    <div className="sp-miniTrack__main"><div className="sp-miniTrack__title">{track.title}</div><div className="sp-miniTrack__meta">{text.trackPlays(track.playsCount)}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
