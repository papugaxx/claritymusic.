

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { createAdminGenre, deleteAdminGenre, getAdminGenres, updateAdminGenre } from "../../services/adminApi.js";
import { AdminTaxonomyPage } from "./AdminTaxonomyPage.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AdminGenresPage() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AdminTaxonomyPage
      title="Genres"
      subtitle="Manage genre options used across tracks and playlists."
      entityLabel="Genre"
      loadItems={getAdminGenres}
      createItem={createAdminGenre}
      updateItem={updateAdminGenre}
      deleteItem={deleteAdminGenre}
      emptyText="No genres yet."
    />
  );
}
