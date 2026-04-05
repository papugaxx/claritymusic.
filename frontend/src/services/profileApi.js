

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { apiPut, getMeProfile, getMyFollowing, getPlaylistsPage, uploadFile } from "./api.js";

export { getMeProfile, getMyFollowing, getPlaylistsPage };

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updateProfile(body) {
  return apiPut('/api/me/profile', body);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function uploadAvatar(file) {
  return uploadFile('/api/uploads/avatar', file);
}
