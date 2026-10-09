import { OPCOS_LABEL } from "../constants/recruteur.js"

/**
 * Filtre OPCO de la recherche d'offres : paramètres d'URL `opco` et `opcoUrl` du moteur legacy,
 * posés par les sites d'OPCO qui renvoient vers La bonne alternance. Le proxy UI les garde en
 * cookie de session ; ils restreignent les offres d'emploi, jamais les formations.
 */

export const OPCO_FILTER_PARAM = "opco"
export const OPCO_URL_FILTER_PARAM = "opcoUrl"

// « inconnu » et « OPCO multiple » ne désignent pas un OPCO : pas de clé de filtre.
const OPCO_FILTER_KEYS = [
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

const OPCO_URL_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

/** Nom de domaine en minuscules (`https://www.JeCompte.fr/` → `www.jecompte.fr`) ; null s'il n'en est pas un. */
export const normalizeOpcoUrl = (value: string | null | undefined): string | null => {
  const url = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
  return url && url.length <= 100 && OPCO_URL_PATTERN.test(url) ? url : null
}

/**
 * Sites sectoriels d'ATLAS et conventions collectives (IDCC) qu'ils couvrent. L'URL de site
 * d'OPCO d'une entreprise se déduit de `workplace_idcc` : aucune source ne la fournit.
 */
const OPCO_URL_IDCCS: Record<string, readonly number[]> = {
  // Numérique, ingénierie, conseil, événementiel
  "www.concepteursdavenirs.fr": [1486, 2543, 3213],
  // Assurance
  "www.jassuremonfutur.fr": [438, 1672, 1679, 1801, 2247, 2335, 2357],
  // Expertise comptable et audit
  "www.jecompte.fr": [787, 1237, 3160],
  // Banque et finance
  "www.jinvestislavenir.fr": [478, 1468, 2120, 2622, 2931, 3210, 5005],
}

const OPCO_URL_BY_IDCC = new Map(Object.entries(OPCO_URL_IDCCS).flatMap(([url, idccs]) => idccs.map((idcc) => [idcc, url] as const)))

export const getOpcoUrlByIdcc = (idcc: number | null | undefined): string | null => (idcc == null ? null : (OPCO_URL_BY_IDCC.get(idcc) ?? null))
