

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import CoverArt from "../media/CoverArt.jsx";
import ArtistAvatar from "../media/ArtistAvatar.jsx";
import { getMoodIcon } from "../../features/home/homeViewModel.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function HomeHero({
  t,
  moods,
  mood,
  setMood,
  genres,
  genre,
  setGenre,
  featured,
  heroDescription,
  heroPrimaryMeta,
  playFromHome,
  heroQueue,
  loading,
  heroRecent,
  playTrack,
  recent,
  heroQueueTrack,
  me,
  heroArtist,
  navigate,
}) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="home__hero glass">
      <div className="home__heroTop" aria-label={t("home.moods")}>
        <div className="home__heroFilterLabel">{t("home.moods")}</div>

        <div className="home__heroChips">
          {moods.slice(0, 7).map((item) => (
            <button
              key={item.id}
              className={`chip ${mood === item.id ? "is-active" : ""}`}
              onClick={() => setMood(item.id)}
              type="button"
              title={item.label}
            >
              {item.id !== "all" ? <span className="chip__icon">{getMoodIcon(item)}</span> : null}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="home__heroCompact">
        <div className="home__heroMainCard">
          <div className="home__heroMainVisual">
            <div className="home__heroMainArtFrame">
              <CoverArt src={featured?.coverUrl} title={featured?.title || "Featured track"} className="home__heroMainArt" />
            </div>
          </div>

          <div className="home__heroMainContent">
            <div className="home__heroBadge">{t("home.featured")}</div>
            <div className="home__heroMainTitle">{featured?.title || t("home.heroFallbackText")}</div>
            <div className="home__heroMainMeta">{featured?.artist?.name || t("home.recommendations")}</div>
            <div className="home__heroMainText">{heroDescription}</div>

            <div className="home__heroMetaRow">
              {heroPrimaryMeta.map((item) => (
                <span key={item} className="home__heroMetaPill">{item}</span>
              ))}
              <button
                className="btn primary home__heroPlayBtn"
                type="button"
                onClick={(event) => playFromHome(event, featured, heroQueue)}
                disabled={!featured || loading}
              >
                {t("home.play")}
              </button>
            </div>
          </div>
        </div>

        <div className="home__heroSideCards">
          <button
            type="button"
            className="home__heroMiniCard home__heroMiniCard--queue"
            onClick={() => {
              if (heroRecent) {
                void playTrack(heroRecent, recent);
                return;
              }
              if (featured) void playTrack(featured, heroQueue);
            }}
          >
            <div className="home__heroMiniHead">
              <div className="home__heroMiniThumbWrap">
                <CoverArt
                  src={heroQueueTrack?.coverUrl}
                  title={heroQueueTrack?.title || "Track"}
                  className="home__heroMiniThumb"
                />
              </div>
              <div className="home__heroMiniLabel">
                {me?.isAuthenticated ? t("home.continueListening") : t("home.quickStart")}
              </div>
            </div>
            <div className="home__heroMiniTitle">{heroQueueTrack?.title || t("home.heroFallbackText")}</div>
            <div className="home__heroMiniSub">{heroQueueTrack?.artist?.name || "CLARITY recommendations"}</div>
          </button>

          <button
            type="button"
            className="home__heroMiniCard home__heroMiniCard--artist"
            onClick={() => {
              if (heroArtist?.id) {
                navigate(`/app/artists/${heroArtist.id}`);
                return;
              }
              if (me?.isAuthenticated) {
                navigate("/app/me");
                return;
              }
              navigate("/app");
            }}
          >
            <div className="home__heroMiniHead">
              <div className="home__heroMiniAvatarWrap">
                <ArtistAvatar
                  src={heroArtist?.avatarUrl}
                  name={heroArtist?.name || "Artist"}
                  className="home__heroMiniAvatar"
                />
              </div>
              <div className="home__heroMiniLabel">{t("home.artistHighlight")}</div>
            </div>
            <div className="home__heroMiniTitle">{heroArtist?.name || t("home.yourMusicSpace")}</div>
            <div className="home__heroMiniSub">
              {heroArtist?.id ? t("home.openArtistProfile") : t("home.openYourProfile")}
            </div>
          </button>
        </div>
      </div>

      <div className="home__genres" aria-label="Genres">
        <div className="home__genresLabel">{t("home.genres")}</div>

        <div className="home__genresScroll">
          {genres.map((item) => (
            <button
              key={item.id}
              className={`chip ${genre === item.id ? "is-active" : ""}`}
              type="button"
              onClick={() => setGenre(item.id)}
              title={item.label}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
