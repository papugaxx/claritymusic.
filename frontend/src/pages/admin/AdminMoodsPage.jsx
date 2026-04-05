

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { createAdminMood, deleteAdminMood, getAdminMoods, updateAdminMood } from "../../services/adminApi.js";
import { AdminTaxonomyPage } from "./AdminTaxonomyPage.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AdminMoodsPage() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <AdminTaxonomyPage
      title="Moods"
      subtitle="Manage the mood taxonomy used for discovery and filtering."
      entityLabel="Mood"
      loadItems={getAdminMoods}
      createItem={createAdminMood}
      updateItem={updateAdminMood}
      deleteItem={deleteAdminMood}
      emptyText="No moods yet."
    />
  );
}
