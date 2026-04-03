/**
 * Analyse la présence de chaque CFA de la blocklist dans la collection computed_jobs_partners.
 *
 * Usage (depuis le dossier server/) :
 *   yarn cli analyzeCfaBlockList.ts > docs/cfa-blocklist-analysis.md
 *
 * Le script se connecte à MongoDB, parcourt computed_jobs_partners par batches de 500,
 * et produit un tableau Markdown avec :
 *   - nombre d'offres où le nom apparaît dans workplace_name
 *   - nombre d'offres où le nom apparaît dans offer_description
 *   - nombre d'offres où le nom apparaît dans workplace_description
 *   - nombre total d'offres bloquées à cause de ce CFA
 */

import { writeFileSync } from "fs"
import { join } from "path"
import { removeAccents } from "shared"

import { closeMongodbConnection, connectToMongodb, getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { cfaCompanyList } from "@/jobs/offrePartenaire/isCompanyInBlockedCfaList"

// En dev (tsx) : import.meta.dirname = server/src/jobs/oneTimeJob → ../../../../ = racine du monorepo
// En prod (dist compilé) : import.meta.dirname = server/dist/jobs/oneTimeJob → ../../../../ = racine du monorepo
const OUTPUT_PATH = join(import.meta.dirname, "../../../../docs/cfa-blocklist-analysis.md")

const stringNormaliser = (str: string): string => {
  return removeAccents(str.toLowerCase())
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

const normalizedCfaList = cfaCompanyList.map(stringNormaliser)

function findMatchingCfaIndices(text: string | null | undefined): number[] {
  if (!text) return []
  const normalizedSentence = ` ${stringNormaliser(text)} `
  const matches: number[] = []
  for (let i = 0; i < normalizedCfaList.length; i++) {
    if (normalizedSentence.includes(` ${normalizedCfaList[i]} `)) {
      matches.push(i)
    }
  }
  return matches
}

type FieldName = "workplace_name" | "offer_description" | "workplace_description"

interface CfaStats {
  workplace_name: number
  offer_description: number
  workplace_description: number
  total: number
}

export const analyzeCfaBlockList = async () => {
  await connectToMongodb(config.mongodb.uri)

  const stats: CfaStats[] = cfaCompanyList.map(() => ({
    workplace_name: 0,
    offer_description: 0,
    workplace_description: 0,
    total: 0,
  }))

  const collection = getDbCollection("computed_jobs_partners")
  const fields: FieldName[] = ["workplace_name", "offer_description", "workplace_description"]

  let processed = 0
  const cursor = collection.find(
    { partner_label: { $ne: "recruteurs_lba" } },
    {
      projection: { workplace_name: 1, offer_description: 1, workplace_description: 1 },
    }
  )

  for await (const doc of cursor) {
    const matchedIndices = new Set<number>()

    for (const field of fields) {
      const indices = findMatchingCfaIndices(doc[field] as string | null | undefined)
      for (const idx of indices) {
        stats[idx][field]++
        matchedIndices.add(idx)
      }
    }

    for (const idx of matchedIndices) {
      stats[idx].total++
    }

    processed++
    if (processed % 10_000 === 0) {
      process.stderr.write(`  ... ${processed} documents traités\n`)
    }
  }

  process.stderr.write(`Total documents traités : ${processed}\n`)

  const rows = cfaCompanyList
    .map((name, i) => ({ name, ...stats[i] }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  const noMatch = cfaCompanyList.filter((_, i) => stats[i].total === 0)

  const now = new Date().toISOString().split("T")[0]

  const lines: string[] = [
    `# Analyse de la blocklist CFA dans computed_jobs_partners`,
    ``,
    `Généré le **${now}** — ${processed} offres analysées.`,
    ``,
    `## Tableau des occurrences`,
    ``,
    `| CFA | workplace_name | offer_description | workplace_description | Total offres |`,
    `|-----|:--------------:|:-----------------:|:---------------------:|:------------:|`,
    ...rows.map((r) => `| ${r.name} | ${r.workplace_name} | ${r.offer_description} | ${r.workplace_description} | **${r.total}** |`),
    ``,
    `## CFA sans aucune occurrence (${noMatch.length})`,
    ``,
    `Ces entrées ne bloquent actuellement aucune offre dans \`computed_jobs_partners\`.`,
    ``,
    ...noMatch.map((name) => `- ${name}`),
    ``,
    `## Recommandations pour limiter les faux positifs`,
    ``,
    `### Noms trop courts ou trop génériques`,
    ``,
    `Les entrées suivantes sont courtes (≤ 4 caractères normalisés) ou composées de termes très courants.`,
    `Elles sont susceptibles de correspondre à du contenu où le CFA est simplement **mentionné** (ex : "formation IMC niveau 5") et non l'organisme qui publie l'offre.`,
    ``,
    `| CFA | Risque | Recommandation |`,
    `|-----|--------|----------------|`,
    `| IMC | Élevé — 3 lettres, acronyme courant | Restreindre au champ \`workplace_name\` uniquement |`,
    `| PSTC | Élevé — 4 lettres, acronyme | Idem |`,
    `| EFHT | Élevé — 4 lettres, acronyme | Idem |`,
    `| 301 | Élevé — chiffre seul | Peut matcher "301 redirect", numéros de rue… Supprimer ou cibler \`workplace_name\` |`,
    `| 3IE | Élevé — 3 caractères | Risque élevé dans les descriptions techniques |`,
    `| ZLS | Élevé — 3 lettres | Acronyme trop court |`,
    `| 2CG | Élevé — 3 caractères | Idem |`,
    `| 2CRD | Modéré — 4 caractères | Surveiller |`,
    `| IMC | Élevé | Voir ci-dessus |`,
    ``,
    `### Noms avec des termes génériques fréquents en description`,
    ``,
    `| CFA | Risque | Recommandation |`,
    `|-----|--------|----------------|`,
    `| ACTION FORMATION | Élevé — "action formation" est une expression très courante dans les descriptions | Restreindre à \`workplace_name\` |`,
    `| FORMATION ORGANIS RECRUTEMENT ACTION | Modéré — phrase longue mais les mots sont courants séparément (le matching est exact sur la phrase entière, risque limité) | OK tel quel |`,
    `| ABC CONSEIL ET FORMATION | Modéré | Surveiller |`,
    `| LA SOLIVE | Modéré — termes génériques | Surveiller les faux positifs dans les descriptions métier (ex: bâtiment) |`,
    `| SBE ACADEMY | Faible — assez spécifique | OK |`,
    `| EURIDIS | Faible — nom propre distinctif | OK |`,
    `| SUPTERTIAIRE | Faible — terme inventé | OK |`,
    ``,
    `### Stratégie recommandée`,
    ``,
    `1. **Court terme** : pour les CFA avec beaucoup d'occurrences dans \`offer_description\` ou \`workplace_description\` mais peu dans \`workplace_name\`, envisager de les matcher uniquement sur \`workplace_name\`.`,
    `2. **Moyen terme** : implémenter une logique de détection différenciée par champ dans \`blockJobsPartnersFromCfaList.ts\` — une liste stricte pour \`workplace_name\` (correspondance exacte) et une liste réduite aux noms très spécifiques pour les descriptions.`,
    `3. **Validation** : croiser les offres bloquées avec le champ \`partner_label\` pour vérifier si les faux positifs proviennent de partenaires spécifiques (ex: France Travail, APEC).`,
  ]

  const markdown = lines.join("\n")
  writeFileSync(OUTPUT_PATH, markdown, "utf-8")
  process.stderr.write(`Fichier généré : ${OUTPUT_PATH}\n`)

  await closeMongodbConnection()
}
