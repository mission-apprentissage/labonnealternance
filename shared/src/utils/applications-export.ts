import { toSnakeCaseSlug } from "./string-utils.js"

/** Nom du récapitulatif des candidatures d'une offre (#5769), partagé par l'API et le lien de téléchargement. */
export const getApplicationsExportFileName = (offerTitle: string) => `candidatures_de_${toSnakeCaseSlug(offerTitle) || "offre"}.xlsx`
