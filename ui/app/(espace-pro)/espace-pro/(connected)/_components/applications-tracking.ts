import type { IApplicationsConsultation } from "shared/utils/applications-consultation"

/**
 * Dimensions Matomo du suivi des candidatures, pour les indicateurs du ticket besoin #5767. Aucune donnée nominative :
 * le type d'espace, l'état de l'offre et le statut de la candidature suffisent aux indicateurs.
 */
export const getUserTypeDimension = (cfaEstablishmentId?: string | null) => (cfaEstablishmentId ? "cfa" : "entreprise")

/** Statut de l'offre tant qu'elle est ouverte (active, pending…), sinon ce qui l'a close : filled, cancelled ou expired. */
export const getOfferStateDimension = (offerStatus: string, consultation: IApplicationsConsultation) =>
  consultation.status === "offer_open" ? offerStatus.toLowerCase() : consultation.end.reason

/** Intention du recruteur (entretien, refus, traitee_par_un_autre_moyen), ou pending sans réponse. */
export const getApplicationStatusDimension = (intention: string | null) => intention ?? "pending"
