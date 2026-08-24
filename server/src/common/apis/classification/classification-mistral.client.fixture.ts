/**
 * Réponse brute de sendMistralMessages pour les tests de classification. Les offres envoyées au
 * provider sont identifiées par leur index dans le lot ("0", "1", ...) — un id absent de la
 * réponse fait échouer tout le lot (getMistralClassificationBatch), contrairement à l'ancien
 * client Lab qui laissait simplement l'offre non classifiée.
 */
export function mistralClassificationResponse(results: { id: string; label: "publish" | "unpublish"; scores?: { publish: number; unpublish: number } }[]): string {
  return JSON.stringify({ results: results.map((result) => ({ scores: { publish: 0.4, unpublish: 0.6 }, ...result })) })
}
