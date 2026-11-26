/**
 * Sigles de diplôme → métiers visés, dans les modes d'offres (#5638). Les offres citent
 * rarement le sigle : la recherche d'un sigle seul ouvre aussi les offres des métiers auxquels
 * le diplôme prépare, repérées par leurs `rome_labels`.
 *
 * Hors collection de synonymes : `lba_synonyms` sert les trois index, une correspondance sigle →
 * métier y élargirait aussi le mode formations, et un groupe `equivalent` ferait remonter les
 * formations ou offres « NDRC » sur la recherche « attaché commercial ». Ici le sens est unique.
 *
 * Codes retenus : lien RNCP → ROME du catalogue des formations, plus les codes portés par au
 * moins 5 % des offres jobs_partners qui citent le diplôme. Sont écartés les postes de cadre
 * (direction, chef de produit, marketing, ingénieur) et les exceptions notées par sigle.
 * Clés : sigle passé par normalizeTerm (minuscules, sans accents).
 */
export const DIPLOMA_JOB_ROME_CODES: Readonly<Record<string, readonly string[]>> = {
  // BTS Négociation et digitalisation de la relation client
  ndrc: ["D1410", "D1401", "M1704", "D1408", "D1501"],
  // BTS Management commercial opérationnel. Sans G1401 Adjoint de direction en hôtellerie-restauration
  // (9 % des offres) : hors du commerce de détail que vise le diplôme.
  mco: ["D1401", "D1501", "D1506", "M1704", "D1106", "D1403", "D1410", "D1214"],
  // BTS Gestion de la PME. Sans M1203 Comptable (lien catalogue) : métier propre au BTS CG.
  gpme: ["M1607", "M1621", "M1501", "M1604"],
  // CAP Accompagnant éducatif petite enfance. Sans K1306 AES (15 % des offres) : métier du DEAES.
  aepe: ["K1303", "K1310", "K1307"],
  // BTS Services informatiques aux organisations
  sio: ["M1810", "M1801", "M1805", "I1401", "M1861"],
  // BTS Comptabilité et gestion
  cg: ["M1203", "M1213"],
  // BTS Électrotechnique. Sans H1506 Contrôleur technique en métallurgie (8 % des offres) : hors électricité.
  electrotechnique: ["I1309", "I1324", "F1602", "F1629", "I1304", "H1504", "H1209", "I1307"],
}

// hasOwn : « constructor » ou « toString » tapés dans la recherche ne sont pas des sigles.
export const isDiplomaSigle = (term: string): boolean => Object.hasOwn(DIPLOMA_JOB_ROME_CODES, term)

const ROME_LABELS_PATH = { value: "rome_labels", multi: "standard" }

// Approximation de lucene.standard : minuscules, découpe sur tout sauf lettres, chiffres et
// apostrophe (« d'enfant » reste un jeton, « Expert-comptable » en fait deux).
const labelTokens = (label: string): string[] =>
  label
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)

const containsSequence = (haystack: string[], needle: string[]): boolean => {
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((token, j) => haystack[i + j] === token)) return true
  }
  return false
}

const phrase = (query: string) => ({ phrase: { query, path: ROME_LABELS_PATH, slop: 0 } })

type DiplomaJobsClause = { clause: object | null; unresolvedCodes: string[] }

// Une entrée par Map du référentiel (renouvelée par le cache de getCachedRomeLabelByCode) :
// le calcul des intitulés englobants parcourt tout le référentiel.
const clausesByReferentiel = new WeakMap<ReadonlyMap<string, string>, Map<string, DiplomaJobsClause>>()

/**
 * Clause d'entrée « le doc porte l'un des intitulés ROME visés par le sigle ». Un `phrase` matche
 * aussi tout intitulé qui contient la cible (« Comptable » dans « Expert-comptable / Experte-comptable ») :
 * ces intitulés englobants sont exclus, sauf s'ils sont eux-mêmes visés. L'exclusion porte sur le
 * doc entier : une offre qui porte aussi un intitulé englobant sort, perte préférée au bruit
 * (« Secrétaire » seul ferait entrer secrétaires de mairie et secrétaires médicales).
 * mongot ne sépare pas les éléments d'un tableau : un `phrase` peut matcher à cheval sur deux
 * intitulés voisins, et ["Secrétaire", "Comptable"] tombe sous l'exclusion « Secrétaire comptable ».
 * Score constant bas : en tri par pertinence, les offres qui citent le sigle restent devant.
 * Résultat partagé entre requêtes, à ne pas muter.
 */
export function buildDiplomaJobsClause(sigle: string, romeLabelByCode: ReadonlyMap<string, string>): DiplomaJobsClause {
  if (!isDiplomaSigle(sigle)) return { clause: null, unresolvedCodes: [] }
  let cache = clausesByReferentiel.get(romeLabelByCode)
  if (!cache) {
    cache = new Map()
    clausesByReferentiel.set(romeLabelByCode, cache)
  }
  const cached = cache.get(sigle)
  if (cached) return cached
  const built = computeDiplomaJobsClause(DIPLOMA_JOB_ROME_CODES[sigle], romeLabelByCode)
  cache.set(sigle, built)
  return built
}

function computeDiplomaJobsClause(codes: readonly string[], romeLabelByCode: ReadonlyMap<string, string>): DiplomaJobsClause {
  const unresolvedCodes = codes.filter((code) => !romeLabelByCode.has(code))
  const targets = [...new Set(codes.flatMap((code) => romeLabelByCode.get(code) ?? []))]
  if (!targets.length) return { clause: null, unresolvedCodes }

  const allLabels = [...new Set(romeLabelByCode.values())]
  const branches = targets.map((target) => {
    const targetTokens = labelTokens(target)
    const enclosing = allLabels.filter((label) => !targets.includes(label) && containsSequence(labelTokens(label), targetTokens))
    return enclosing.length ? { compound: { must: [phrase(target)], mustNot: enclosing.map(phrase) } } : phrase(target)
  })

  return { clause: { compound: { should: branches, minimumShouldMatch: 1, score: { constant: { value: 1 } } } }, unresolvedCodes }
}
