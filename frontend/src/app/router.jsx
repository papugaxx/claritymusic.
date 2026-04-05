

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import RouteLoadingFallback from "./RouteLoadingFallback.jsx";
import { RequireAdmin, RequireArtist, RequireAuth, RequireGuest } from "./RouteGuards.jsx";

const AppLayout = lazy(() => import("./AppLayout.jsx"));
const AdminLayout = lazy(() => import("./AdminLayout.jsx"));

const Landing = lazy(() => import("../pages/Landing.jsx"));

const Home = lazy(() => import("../pages/Home.jsx"));
const Liked = lazy(() => import("../pages/Liked.jsx"));
const Library = lazy(() => import("../pages/Library.jsx"));
const Search = lazy(() => import("../pages/Search.jsx"));
const Playlist = lazy(() => import("../pages/Playlist.jsx"));
const Track = lazy(() => import("../pages/Track.jsx"));
const Profile = lazy(() => import("../pages/Profile.jsx"));
const Settings = lazy(() => import("../pages/Settings.jsx"));
const ArtistPublic = lazy(() => import("../pages/ArtistPublic.jsx"));
const ArtistStudio = lazy(() => import("../pages/ArtistStudio.jsx"));

const Login = lazy(() => import("../pages/Login.jsx"));
const RegisterEmail = lazy(() => import("../pages/RegisterEmail.jsx"));
const RegisterPassword = lazy(() => import("../pages/RegisterPassword.jsx"));
const RegisterProfile = lazy(() => import("../pages/RegisterProfile.jsx"));
const EmailConfirmationNotice = lazy(() => import("../pages/EmailConfirmationNotice.jsx"));
const ConfirmEmail = lazy(() => import("../pages/ConfirmEmail.jsx"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/ResetPassword.jsx"));
const GoogleAuthCallback = lazy(() => import("../pages/GoogleAuthCallback.jsx"));

const AdminTracks = lazy(() => import("../pages/AdminTracks.jsx"));
const AdminGenres = lazy(() => import("../pages/AdminGenres.jsx"));
const AdminMoods = lazy(() => import("../pages/AdminMoods.jsx"));

const NotFound = lazy(() => import("../pages/NotFound.jsx"));
const RouteError = lazy(() => import("../pages/RouteError.jsx"));

// Функція нижче інкапсулює окрему частину логіки цього модуля
function withSuspense(node) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <Suspense fallback={<RouteLoadingFallback />}>{node}</Suspense>;
}

const router = createBrowserRouter([
  { path: "/", element: withSuspense(<Landing />), errorElement: withSuspense(<RouteError />) },

  { path: "/login", element: withSuspense(<RequireGuest><Login /></RequireGuest>) },
  { path: "/register", element: withSuspense(<RequireGuest><RegisterEmail /></RequireGuest>) },
  { path: "/register/password", element: withSuspense(<RequireGuest><RegisterPassword /></RequireGuest>) },
  { path: "/register/profile", element: withSuspense(<RequireGuest><RegisterProfile /></RequireGuest>) },
  { path: "/confirm-email/pending", element: withSuspense(<EmailConfirmationNotice />) },
  { path: "/email-not-confirmed", element: withSuspense(<EmailConfirmationNotice />) },
  { path: "/confirm-email", element: withSuspense(<ConfirmEmail />) },
  { path: "/forgot-password", element: withSuspense(<ForgotPassword />) },
  { path: "/reset-password", element: withSuspense(<ResetPassword />) },
  { path: "/auth/google/callback", element: withSuspense(<GoogleAuthCallback />) },

  {
    path: "/app",
    element: withSuspense(<AppLayout />),
    errorElement: withSuspense(<RouteError />),
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: "search", element: withSuspense(<Search />) },
      { path: "library", element: withSuspense(<RequireAuth><Library /></RequireAuth>) },
      { path: "liked", element: withSuspense(<RequireAuth><Liked /></RequireAuth>) },
      { path: "playlist/:id", element: withSuspense(<RequireAuth><Playlist /></RequireAuth>) },
      { path: "track/:id", element: withSuspense(<Track />) },
      { path: "me", element: withSuspense(<RequireAuth><Profile /></RequireAuth>) },
      { path: "settings", element: withSuspense(<RequireAuth><Settings /></RequireAuth>) },
      { path: "artists/:id", element: withSuspense(<ArtistPublic />) },
      { path: "artist/studio", element: withSuspense(<RequireArtist><ArtistStudio /></RequireArtist>) },
      { path: "*", element: withSuspense(<NotFound />) },
    ],
  },

  {
    path: "/admin",
    element: withSuspense(<RequireAdmin><AdminLayout /></RequireAdmin>),
    errorElement: withSuspense(<RouteError />),
    children: [
      { path: "tracks", element: withSuspense(<AdminTracks />) },
      { path: "genres", element: withSuspense(<AdminGenres />) },
      { path: "moods", element: withSuspense(<AdminMoods />) },
      { path: "*", element: withSuspense(<NotFound />) },
    ],
  },

  { path: "*", element: withSuspense(<NotFound />), errorElement: withSuspense(<RouteError />) },
]);

export default router;
