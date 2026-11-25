/**
 * Graphies d'un mot composé : le ROME 4 soude les composés savants en -o (« médicosocial »,
 * « socioéducatif »), les offres et formations écrivent souvent le trait d'union (« médico-social »),
 * et inversement. lucene.french coupe au trait d'union et ne rapproche pas les deux formes ; le fuzzy
 * (1 édition) et les synonymes (requête entière) non plus. Les variantes calculées ici sont des
 * alternatives dans la couverture d'un terme (cf. buildTermCoverageClause) : elles ne comptent pas
 * de terme en plus dans le minimumShouldMatch.
 */

// Éléments savants en -o attestés soudés dans le référentiel ROME (test dans search-compound-words.test.ts).
// « para », « auto », « multi » écartés : la forme soudée y est la norme et la coupe toucherait des mots courants.
export const WELDED_COMPOUND_PREFIXES = ["aero", "agro", "audio", "bio", "eco", "electro", "geo", "hydro", "medico", "pharmaco", "photo", "psycho", "radio", "socio"]

// Longueur minimale de la seconde moitié : en deçà, la coupe tombe sur un suffixe (« socio|logie »,
// « psycho|se ») et la phrase pourrait se réduire au préfixe seul si la moitié est un mot vide.
const MIN_REMAINDER_LENGTH = 6

const HYPHENS = /^[-‐‑]$/u

export type CompoundSpellingVariants = {
  /** Forme coupée, à chercher en `phrase` (« médicosocial » → « médico social »). */
  phrases: string[]
  /** Forme soudée, à chercher en `text` (« médico-social » → « médicosocial »). */
  welded: string[]
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")

const weldedPrefixOf = (folded: string) => WELDED_COMPOUND_PREFIXES.find((prefix) => folded.startsWith(prefix))

function splitWelded(token: string): string | null {
  const chars = [...token]
  const folded = chars.map(fold)
  // Coupe calculée sur la forme sans accents, appliquée à la saisie : un caractère qui ne se replie
  // pas en un seul (ligature…) décalerait la position.
  if (folded.some((c) => c.length !== 1)) return null
  const prefix = weldedPrefixOf(folded.join(""))
  if (!prefix || chars.length - prefix.length < MIN_REMAINDER_LENGTH) return null
  return `${chars.slice(0, prefix.length).join("")} ${chars.slice(prefix.length).join("")}`
}

/**
 * Variantes de graphie par terme de la requête, indexées comme les termes de tokenizeQuery (saisie
 * en minuscules) :
 * - terme soudé à élément savant (« médicosocial ») → forme coupée ;
 * - paire séparée par un trait d'union (« médico-social », « e-commerce »), ou par une espace quand
 *   le premier mot est un élément savant (« socio éducatif ») → forme soudée, sur les deux moitiés :
 *   un doc qui l'écrit couvre les deux termes, comme un doc qui écrit le trait d'union.
 */
export function compoundSpellingVariants(q: string): Map<string, CompoundSpellingVariants> {
  const text = q.toLowerCase()
  const tokens = [...text.matchAll(/[\p{L}\p{N}]+/gu)]
  const variants = new Map<string, CompoundSpellingVariants>()
  const add = (token: string, kind: keyof CompoundSpellingVariants, value: string) => {
    const entry = variants.get(token) ?? { phrases: [], welded: [] }
    if (!entry[kind].includes(value)) entry[kind].push(value)
    variants.set(token, entry)
  }

  tokens.forEach((match, i) => {
    const token = match[0]
    const split = splitWelded(token)
    if (split) add(token, "phrases", split)

    const next = tokens[i + 1]
    if (!next) return
    const separator = text.slice(match.index + token.length, next.index)
    const isHyphenPair = HYPHENS.test(separator)
    const isSpacedCompound = /^\s+$/u.test(separator) && WELDED_COMPOUND_PREFIXES.includes(fold(token)) && next[0].length >= MIN_REMAINDER_LENGTH
    if (!isHyphenPair && !isSpacedCompound) return
    const welded = token + next[0]
    add(token, "welded", welded)
    add(next[0], "welded", welded)
  })
  return variants
}

/**
 * Clause de couverture d'un terme sur un champ, élargie à ses variantes de graphie. Sans variante,
 * la clause reste inchangée. Variantes sans fuzzy : elles servent une graphie exacte, et chaque
 * expansion fuzzy compte dans maxClauseCount (#5153).
 */
export function withCompoundSpellingVariants(clause: object, path: string, boost: number, variants: CompoundSpellingVariants | undefined): object {
  if (!variants) return clause
  const score = { boost: { value: boost } }
  return {
    compound: {
      should: [clause, ...variants.phrases.map((query) => ({ phrase: { query, path, score } })), ...variants.welded.map((query) => ({ text: { query, path, score } }))],
      minimumShouldMatch: 1,
    },
  }
}
