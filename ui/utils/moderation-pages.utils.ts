import type { IPage } from "./routes.utils"

// Hors de routes.utils, chargé sur toutes les pages : y grossir de ces trois entrées change le découpage Turbopack
// de la page d'accueil (+9,7 ko gzip de modules dupliqués, cf. #5214).
export const MODERATION_PAGES = {
  adminQueue: { getPath: () => "/espace-pro/administration/offres-a-moderer", title: "Offres à modérer" } satisfies IPage,
  opcoQueue: { getPath: () => "/espace-pro/opco/offres-a-moderer", title: "Offres en modération" } satisfies IPage,
  offre: ({ job_id, userType, offer_title }: { job_id: string; userType: "ADMIN" | "OPCO"; offer_title?: string }): IPage => ({
    getPath: () => `${userType === "OPCO" ? "/espace-pro/opco" : "/espace-pro/administration"}/offres-a-moderer/${job_id}`,
    title: offer_title ?? "Modération de l'offre",
  }),
}
