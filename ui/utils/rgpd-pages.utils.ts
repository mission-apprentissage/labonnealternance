import type { IPage } from "./routes.utils"

// Hors de routes.utils, chargé sur toutes les pages (cf. moderation-pages.utils, #5214).
export const RGPD_PAGES = {
  admin: { getPath: () => "/espace-pro/administration/rgpd", title: "Effacement des données d'un utilisateur" } satisfies IPage,
}
