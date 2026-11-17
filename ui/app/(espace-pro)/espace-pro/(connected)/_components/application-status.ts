import { ApplicationIntention } from "shared/constants/application"

/**
 * Libellé et pastille d'une candidature selon l'intention du recruteur (#5769). Hors refus, une intention vaut prise de
 * contact : une candidature traitée par un autre moyen s'affiche aussi « Contacté ».
 */
export const getApplicationStatus = (intention: string | null) => {
  if (!intention) return { label: "EN ATTENTE", variant: "awaiting", isPending: true }
  if (intention === ApplicationIntention.REFUS) return { label: "REFUSÉ", variant: "inactive", isPending: false }
  return { label: "CONTACTÉ", variant: "active", isPending: false }
}
