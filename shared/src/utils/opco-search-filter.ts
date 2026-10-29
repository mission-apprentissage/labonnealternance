import { OPCOS_LABEL } from "../constants/recruteur.js"

/**
 * Filtre OPCO de la recherche d'offres : paramètre d'URL `opco` du moteur legacy, posé par les
 * sites d'OPCO qui renvoient vers La bonne alternance. Il restreint les offres d'emploi, jamais
 * les formations.
 */

export const OPCO_FILTER_PARAM = "opco"

// « inconnu » et « OPCO multiple » ne désignent pas un OPCO : pas de clé de filtre.
export const OPCO_FILTER_KEYS = [
  "AFDAS",
  "AKTO",
  "ATLAS",
  "CONSTRUCTYS",
  "OPCOMMERCE",
  "OCAPIAT",
  "OPCO2I",
  "EP",
  "MOBILITE",
  "SANTE",
  "UNIFORMATION",
] as const satisfies (keyof typeof OPCOS_LABEL)[]

export type IOpcoFilterKey = (typeof OPCO_FILTER_KEYS)[number]

/** Clé courte (`akto`, `EP`…), insensible à la casse ; null sur toute autre valeur, la saisie arrive de l'URL. */
export const parseOpcoFilter = (value: string | null | undefined): IOpcoFilterKey | null => {
  const key = value?.trim().toUpperCase()
  return OPCO_FILTER_KEYS.find((candidate) => candidate === key) ?? null
}

/** Libellé tel que stocké dans `jobs_partners.workplace_opco` et les corpus d'offres. */
export const getOpcoFilterLabel = (key: IOpcoFilterKey): OPCOS_LABEL => OPCOS_LABEL[key]
