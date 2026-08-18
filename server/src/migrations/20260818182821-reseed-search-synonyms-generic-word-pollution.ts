import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// Reseed search_synonyms depuis docs/mongodb/search-synonyms.json (68 groupes patchés,
// cf. PR mots génériques isolés / #5153) : recreateIndexes() appelle seedSearchSynonyms(),
// qui ne touche que les groupes origin "seed" — les groupes "user_queries" générés par
// analyzeSearchQueries ne sont pas affectés.
export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
