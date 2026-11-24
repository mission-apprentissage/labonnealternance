import { OPCOS_LABEL } from "shared/constants/recruteur"

export type IdentifiedOpco = Exclude<OPCOS_LABEL, OPCOS_LABEL.UNKNOWN_OPCO | OPCOS_LABEL.MULTIPLE_OPCO>

/** Libellés d'affichage des OPCO. Record complet : un OPCO ajouté à l'enum casse la compilation tant qu'il n'a pas de libellé. */
export const OPCO_SHORT_LABELS: Record<IdentifiedOpco, string> = {
  [OPCOS_LABEL.AFDAS]: "AFDAS",
  [OPCOS_LABEL.AKTO]: "AKTO",
  [OPCOS_LABEL.ATLAS]: "ATLAS",
  [OPCOS_LABEL.CONSTRUCTYS]: "Constructys",
  [OPCOS_LABEL.OPCOMMERCE]: "L'Opcommerce",
  [OPCOS_LABEL.OCAPIAT]: "OCAPIAT",
  [OPCOS_LABEL.OPCO2I]: "Opco 2i",
  [OPCOS_LABEL.EP]: "Opco EP",
  [OPCOS_LABEL.MOBILITE]: "Opco Mobilités",
  [OPCOS_LABEL.SANTE]: "Opco Santé",
  [OPCOS_LABEL.UNIFORMATION]: "Uniformation",
}

/** OPCO identifié (ni inconnu ni multiple), aligné sur isKnownOpco côté serveur. */
export const isIdentifiedOpco = (opco: OPCOS_LABEL | null | undefined): opco is IdentifiedOpco => Boolean(opco) && Object.hasOwn(OPCO_SHORT_LABELS, opco)
