function wasPageReloaded(): boolean {
  const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  return navigationEntry?.type === "reload"
}

/**
 * Autorise un unique reload automatique par fenêtre de `throttleMs`, identifié par `storageKey`.
 * Repose sur sessionStorage (peut lever en navigation privée / storage désactivé) : dans ce cas,
 * on se rabat sur wasPageReloaded() pour éviter une boucle de reload infinie.
 */
export function shouldReloadOnce(storageKey: string, throttleMs: number): boolean {
  const now = Date.now()

  try {
    const storedValue = window.sessionStorage.getItem(storageKey)
    const lastReload = storedValue ? Number(storedValue) : 0

    if (!lastReload || Number.isNaN(lastReload) || now - lastReload > throttleMs) {
      window.sessionStorage.setItem(storageKey, String(now))
      return true
    }

    return false
  } catch {
    return !wasPageReloaded()
  }
}
