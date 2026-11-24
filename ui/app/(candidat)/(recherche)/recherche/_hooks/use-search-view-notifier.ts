import { useEffect } from "react"

import { notifyJobSearchViewV3 } from "@/utils/api"

const THROTTLE_MS = 3_000

/**
 * Regroupe les ids d'offres affichées en au plus un envoi par fenêtre de `throttleMs`. Un id
 * n'est envoyé qu'une fois par chargement de page ; ceux ajoutés pendant la fenêtre partent à
 * son expiration, même si plus rien n'est affiché ensuite.
 */
export function createSearchViewNotifier(send: (ids: string[]) => unknown, throttleMs = THROTTLE_MS) {
  const notified = new Set<string>()
  const pending = new Set<string>()
  let lastSendAt = Number.NEGATIVE_INFINITY
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!pending.size) return
    const ids = [...pending]
    pending.clear()
    lastSendAt = Date.now()
    send(ids)
  }

  const add = (ids: string[]) => {
    for (const id of ids) {
      if (notified.has(id)) continue
      notified.add(id)
      pending.add(id)
    }
    if (!pending.size || timer) return
    const wait = lastSendAt + throttleMs - Date.now()
    if (wait <= 0) flush()
    else timer = setTimeout(flush, wait)
  }

  return { add, flush }
}

// Module plutôt que state React : le dédoublonnage survit aux navigations client liste ↔ fiche.
const notifier = createSearchViewNotifier(notifyJobSearchViewV3)

/** Compte l'apparition des offres dans les résultats. Effets seulement : rien n'est envoyé au rendu serveur. */
export function useSearchViewNotifier(jobIds: string[]) {
  const key = jobIds.join(",")

  useEffect(() => {
    if (key) notifier.add(key.split(","))
  }, [key])

  useEffect(() => {
    window.addEventListener("pagehide", notifier.flush)
    return () => window.removeEventListener("pagehide", notifier.flush)
  }, [])
}
