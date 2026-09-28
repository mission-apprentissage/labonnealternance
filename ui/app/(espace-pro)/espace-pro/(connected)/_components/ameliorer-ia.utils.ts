/** Nombre d'améliorations IA offertes par champ libre, sur un dépôt d'offre. */
export const AMELIORER_IA_MAX_USAGES = 2

/**
 * Rang de la tentative sur le point d'être lancée, à partir des crédits restants avant l'appel.
 * Le crédit n'est décrémenté qu'au lancement : c'est la seule dérivation du rang, le résultat est
 * ensuite transporté avec la proposition plutôt que recalculé à l'arbitrage.
 */
export const getAiRewriteAttempt = (remaining: number) => AMELIORER_IA_MAX_USAGES - remaining + 1
