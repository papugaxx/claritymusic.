

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link, useLocation } from "react-router-dom";
import ClarityLogo from "../components/brand/ClarityLogo.jsx";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function NotFound() {
  const location = useLocation();
  const path = location?.pathname || "/";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="auth-page-container">
      <div className="auth-card nf-card">
        <div className="brand-block brand-block--compact">
          <ClarityLogo height={36} />
          <p className="brand-subtitle">CLARITY.music</p>
        </div>

        <div className="nf-grid">
          <div className="nf-left">
            <div className="nf-kicker">404 сторінка</div>
            <div className="nf-title">Упс… сторінку не знайдено.</div>
            <div className="nf-text">
              Схоже, сторінки <span className="nf-path">{path}</span> не існує або її
              перемістили.
            </div>

            <div className="nf-actions">
              <Link className="auth-primary-btn nf-primary" to="/">
                На лендінг
              </Link>
              <Link className="auth-secondary-btn nf-secondary" to="/app">
                У застосунок
              </Link>
            </div>

            <div className="nf-hint">Порада: перевір URL або повернись на головну.</div>
          </div>

          <div className="nf-right" aria-hidden="true">
            <div className="nf-illustration">
              <div className="nf-404">404</div>
              <div className="nf-eq" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <svg className="nf-svg" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g1" x1="58" y1="44" x2="366" y2="382" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c3aed" stopOpacity="0.9" />
                    <stop offset="0.45" stopColor="#23a6ff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#00f5d4" stopOpacity="0.25" />
                  </linearGradient>
                  <radialGradient id="g2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(210 210) rotate(90) scale(200)">
                    <stop stopColor="#FFFFFF" stopOpacity="0.16" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                  <filter id="blur" x="-40" y="-40" width="500" height="500" filterUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                </defs>

                <circle cx="210" cy="210" r="175" fill="url(#g2)" filter="url(#blur)" />

                <path
                  d="M120 210C120 151.5 157.5 114 210 114C262.5 114 300 151.5 300 210"
                  stroke="url(#g1)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <path
                  d="M105 214C105 206.268 111.268 200 119 200H140C151.046 200 160 208.954 160 220V266C160 277.046 151.046 286 140 286H126C114.954 286 106 277.046 106 266L105 214Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="2"
                />
                <path
                  d="M314 214C314 206.268 307.732 200 300 200H279C267.954 200 259 208.954 259 220V266C259 277.046 267.954 286 279 286H293C304.046 286 313 277.046 313 266L314 214Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="2"
                />

                <path
                  d="M156 224C156 194 181.5 170 210 170C238.5 170 264 194 264 224C264 268 233 304 210 304C187 304 156 268 156 224Z"
                  fill="rgba(0,0,0,0.25)"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="2"
                />
                <path
                  d="M184 236C184 226 192 218 202 218H218C228 218 236 226 236 236V246C236 256 228 264 218 264H202C192 264 184 256 184 246V236Z"
                  fill="rgba(35,166,255,0.10)"
                  stroke="rgba(35,166,255,0.40)"
                  strokeWidth="2"
                />
                <path d="M196 244H224" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
                <path d="M196 284C202 291 218 291 224 284" stroke="rgba(255,255,255,0.50)" strokeWidth="3" strokeLinecap="round" />

                <path d="M318 310C334 300 350 296 364 298" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
                <path d="M60 292C76 276 96 268 110 268" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
