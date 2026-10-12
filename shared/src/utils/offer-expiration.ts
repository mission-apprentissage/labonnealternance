const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Une offre reste ouverte aux candidatures pendant les 24 h qui suivent sa date d'expiration.
// Calcul sans dayjs : ce helper est chargé par la fiche offre publique.
export function isOfferExpired(expiration: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!expiration) return false
  const expirationTime = new Date(expiration).getTime()
  return !Number.isNaN(expirationTime) && expirationTime + ONE_DAY_MS < now.getTime()
}
