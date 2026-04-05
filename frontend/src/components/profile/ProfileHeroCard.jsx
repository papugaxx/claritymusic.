

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import ArtistAvatar from "../media/ArtistAvatar.jsx";
import { toAbs } from "../../services/media.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ProfileHeroCard({
  badge,
  title,
  subtitle,
  avatarSrc,
  avatarName,
  coverSrc,
  stats = [],
  actions,
  meta,
}) {
  const normalizedCoverSrc = toAbs(coverSrc || "");
  const hasMeta = meta !== null && meta !== undefined && meta !== false;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <section className="sp-card sp-heroCard sp-heroCard--profile">
      {normalizedCoverSrc ? (
        <div className="sp-heroCard__cover" aria-hidden="true">
          <img className="sp-heroCard__coverImg" src={normalizedCoverSrc} alt="" />
          <div className="sp-heroCard__overlay" />
        </div>
      ) : null}
      <div className={`sp-heroCard__content sp-heroCard__content--profile${hasMeta ? "" : " sp-heroCard__content--profile-noSide"}`}>
        <div className="sp-heroCard__copy sp-heroCard__copy--profile">
          <div className="sp-heroCard__badge sp-heroCard__badge--corner">
            {badge}
          </div>

          <div className="sp-heroCard__main sp-heroCard__main--profile">
            <div className="sp-heroCard__avatarWrap sp-heroCard__avatarWrap--profile">
              <ArtistAvatar
                src={avatarSrc}
                name={avatarName}
                className="sp-heroCard__avatar sp-heroCard__avatar--profile"
              />
            </div>

            <div className="sp-heroCard__body sp-heroCard__body--profile">
              <div className="sp-heroCard__identity">
                <h1 className="sp-heroCard__title sp-heroCard__title--profile">
                  {title}
                </h1>
                <div className="sp-heroCard__subtitle">{subtitle}</div>
              </div>

              {stats?.length ? (
                <div className="sp-heroCard__stats sp-heroCard__stats--profile">
                  {stats.map((item) => (
                    <div key={item.label} className="sp-statPill">
                      <span className="sp-statPill__value">{item.value}</span>
                      <span className="sp-statPill__label">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {actions ? (
                <div className="sp-heroCard__actions sp-heroCard__actions--profile">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {hasMeta ? (
          <aside className="sp-heroCard__side sp-heroCard__side--profile">
            {meta}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
