import { CODE_NAF_REGEX } from "../constants/regex.js"

/**
 * Homogénéise un code NAF (issue #5344). Les sources amont ne s'accordent pas sur le séparateur :
 * l'API entreprise renvoie « 84.11Z », l'APEC « 6202A », le mapper Enedis code « 35.14Y » en dur,
 * le flux INSEE des recruteurs LBA « 5510Z » avec en plus un espace final sur le libellé
 * (constaté sur l'extrait réel de process-recruteurs-lba.test.1.json).
 *
 * Forme retenue : celle publiée par l'INSEE, point après la division (deux chiffres) — cf.
 * https://www.insee.fr/fr/metadonnees/nafr2/sousClasse/47.11F, « 47.11F : Hypermarchés », de classe
 * parente 47.11 et de division 47. Le code lui-même compte 5 caractères (4 chiffres + 1 lettre) et
 * le point n'en fait pas partie, mais c'est la notation de référence, et c'est déjà celle des deux
 * contrats sortants : la sortie NAF de l'API publique v3 et le `SCN_cle` de l'export France Travail.
 *
 * Le point n'est inséré que sur une vraie sous-classe (CODE_NAF_REGEX). Toute autre valeur est
 * conservée nettoyée et compacte plutôt qu'écrasée à null : on ne maîtrise pas ce que les
 * partenaires envoient (code division sur deux chiffres, nomenclature maison) et perdre
 * l'information serait pire que la garder brute.
 *
 * Le préfixe de division reste intact dans tous les cas, donc les filtres existants sur les CFA
 * (`$regex: "^85"` dans blockJobsPartnersWithNaf85, `startsWith("85")` dans
 * validateCreationEntrepriseFromCfa) continuent de matcher.
 */
export const normalizeNafCode = (nafCode: string | null | undefined): string | null => {
  if (!nafCode) return null
  const compact = nafCode.replace(/[^0-9a-zA-Z]/g, "").toUpperCase()
  if (!compact) return null
  return CODE_NAF_REGEX.test(compact) ? `${compact.slice(0, 2)}.${compact.slice(2)}` : compact
}

// U+2018/U+2019/U+201B et la lettre modificative U+02BC, toutes rendues comme une apostrophe
const APOSTROPHES_REGEX = /[‘’‛ʼ]/g

const hasLowerCase = (str: string) => /\p{Ll}/u.test(str)
const hasUpperCase = (str: string) => /\p{Lu}/u.test(str)

/**
 * Homogénéise un libellé NAF (issue #5344) : même libellé INSEE, mais reçu tantôt en capitales
 * (« FABRICATION D'AUTRES PRODUITS LAITIERS », APEC), tantôt en casse de phrase
 * (« Fabrication d'autres produits laitiers », API entreprise) — deux lignes distinctes dans les
 * regroupements Metabase.
 *
 * On ne recasse QUE les libellés uniformément casés (tout en capitales ou tout en minuscules) :
 * un libellé déjà en casse mixte est laissé tel quel, pour ne pas détruire un sigle ou un nom
 * propre dans les libellés maison des partenaires.
 *
 * Limite connue : les capitales désaccentuées ne sont pas restaurées
 * (« ACTIVITES DES SIEGES SOCIAUX » donne « Activites des sieges sociaux », qui ne rejoint pas
 * « Activités des sièges sociaux »). Seule une résolution du libellé officiel depuis le code NAF
 * via un référentiel réglerait ce cas.
 */
export const normalizeNafLabel = (nafLabel: string | null | undefined): string | null => {
  if (!nafLabel) return null
  const cleaned = nafLabel.replace(APOSTROPHES_REGEX, "'").replace(/\s+/g, " ").trim()
  if (!cleaned) return null

  const isUniformlyCased = !hasLowerCase(cleaned) || !hasUpperCase(cleaned)
  if (!isUniformlyCased) return cleaned

  // `replace` sans flag `g` : seule la première lettre est repassée en capitale
  return cleaned.toLocaleLowerCase("fr-FR").replace(/\p{L}/u, (firstLetter) => firstLetter.toLocaleUpperCase("fr-FR"))
}
