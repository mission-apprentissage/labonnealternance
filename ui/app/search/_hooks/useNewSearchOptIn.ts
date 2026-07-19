"use client"

import { useLocalStorage } from "@/app/hooks/useLocalStorage"
import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomoUtils"

export const NEW_SEARCH_OPTIN_KEY = "lba-new-search-optin"

/**
 * Opt-in au nouveau moteur de recherche : flag localStorage persistant, lu par la home et
 * les entrées de recherche. Chaque bascule émet un événement Matomo portant le moteur
 * d'arrivée (`search_engine`) et la page d'origine (`pathname`).
 *
 * ⚠️ useLocalStorage lit le flag dès le premier rendu client : tout affichage conditionné
 * par `optedIn` doit être rendu derrière `ClientOnly` (ou après mount) pour éviter un
 * mismatch d'hydratation SSR.
 */
export function useNewSearchOptIn() {
  const { storedValue, setLocalStorage } = useLocalStorage<boolean>(NEW_SEARCH_OPTIN_KEY, false)

  const optIn = () => {
    setLocalStorage(true)
    pushMatomoEvent({ event: MATOMO_EVENTS.NEW_SEARCH_OPTIN, search_engine: SEARCH_ENGINES.BETA, pathname: window.location.pathname })
  }

  const optOut = () => {
    setLocalStorage(false)
    pushMatomoEvent({ event: MATOMO_EVENTS.NEW_SEARCH_OPTOUT, search_engine: SEARCH_ENGINES.PRODUCTION, pathname: window.location.pathname })
  }

  return { optedIn: storedValue === true, optIn, optOut }
}
