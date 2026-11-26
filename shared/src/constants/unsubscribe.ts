// Les valeurs sont les libellés affichés dans le formulaire et stockés dans `unsubscribedrecruteurslba.unsubscribe_reason` depuis #2198.
// Avant, le formulaire stockait des clés (RECRUTEMENT_CLOS, OPPOSITION…). Ne pas modifier un libellé sans migration.
export const UNSUBSCRIBE_REASONS = {
  DEJA_TROUVE: "Nous avons déjà trouvé nos alternants pour l’année en cours",
  CANDIDATURES_HORS_SUJET: "Les candidatures ne correspondent pas aux activités de mon entreprise",
  AUTRES_CANAUX: "J'utilise d'autres canaux pour mes recrutements d'alternants",
  CAPACITE_FINANCIERE: "Mon entreprise n’a pas la capacité financière pour recruter un alternant",
  NE_RECRUTE_PAS: "Mon entreprise ne recrute pas en alternance",
  OPPOSITION: "Je m'oppose au traitement des mes données par La bonne alternance",
  ENTREPRISE_FERMEE: "L’entreprise est fermée",
  AUTRE: "Autre",
} as const

export type IUnsubscribeReason = (typeof UNSUBSCRIBE_REASONS)[keyof typeof UNSUBSCRIBE_REASONS]
