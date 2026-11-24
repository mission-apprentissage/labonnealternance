/**
 * La date d'édition est saisie sans heure et stockée à minuit UTC : on la lit en UTC pour ne pas
 * afficher la veille dans un fuseau à l'ouest de Greenwich.
 */
export function formatNewsletterDate(isoDate: string, format: "short" | "long" = "short"): string {
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    ...(format === "long" ? { day: "numeric", month: "long", year: "numeric" } : { day: "2-digit", month: "2-digit", year: "numeric" }),
  })
}

/** Valeur d'un `<input type="date">` (AAAA-MM-JJ) pour une date stockée à minuit UTC. */
export function toNewsletterDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10)
}
