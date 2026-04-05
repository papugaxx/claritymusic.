

// Функція нижче інкапсулює окрему частину логіки цього модуля

function normalizeRolesValue(me) {
  if (!me || typeof me !== "object") return [];

  const rawRoles = me.roles ?? me.role ?? me.userRole ?? me.claims?.role ?? [];

  if (Array.isArray(rawRoles)) {
    return rawRoles
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof rawRoles === "string") {
    return rawRoles
      .split(/[\s,;|]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function hasRole(me, role) {
  if (!me?.isAuthenticated || !role) return false;

  const normalizedRole = String(role).trim().toLowerCase();
  if (!normalizedRole) return false;

  if (normalizedRole === "admin" && me?.isAdmin === true) return true;
  if (normalizedRole === "artist" && me?.isArtist === true) return true;

  return normalizeRolesValue(me).includes(normalizedRole);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function isAdmin(me) {
  return hasRole(me, "admin");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function isArtist(me) {
  return hasRole(me, "artist");
}
