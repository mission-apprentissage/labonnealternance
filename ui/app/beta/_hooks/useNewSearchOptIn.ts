"use client"

import { useSyncExternalStore } from "react"

import { MATOMO_EVENTS, pushMatomoEvent, SEARCH_ENGINES } from "@/utils/matomoUtils"

export const NEW_SEARCH_OPTIN_KEY = "lba-new-search-optin"

// Store partagé entre toutes les instances du hook : un simple useState par composant ne
// suffit pas (le lien de sortie et la home sont des composants distincts — la bascule doit
// re-rendre tout le monde : formulaire home, menu de navigation, encarts).
const listeners = new Set<() => void>()

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  // Synchronisation entre onglets (l'event storage ne se déclenche que dans les AUTRES onglets).
  window.addEventListener("storage", onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(NEW_SEARCH_OPTIN_KEY) === "true"
  } catch {
    return false
  }
}

// SSR : toujours legacy — useSyncExternalStore re-rend avec la valeur client après l'hydratation.
const getServerSnapshot = () => false

function setFlag(value: boolean) {
  try {
    localStorage.setItem(NEW_SEARCH_OPTIN_KEY, JSON.stringify(value))
  } catch {
    // localStorage indisponible (navigation privée…) : la bascule ne persiste pas, tant pis.
  }
  for (const onStoreChange of listeners) onStoreChange()
}

/**
 * Opt-in au nouveau moteur de recherche : flag localStorage persistant, lu par la home et
 * les entrées de recherche. Chaque bascule émet un événement Matomo portant le moteur
 * d'arrivée (`search_engine`) et la page d'origine (`pathname`).
 */
export function useNewSearchOptIn() {
  const optedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const optIn = () => {
    setFlag(true)
    pushMatomoEvent({ event: MATOMO_EVENTS.NEW_SEARCH_OPTIN, search_engine: SEARCH_ENGINES.BETA, pathname: window.location.pathname })
  }

  const optOut = () => {
    setFlag(false)
    pushMatomoEvent({ event: MATOMO_EVENTS.NEW_SEARCH_OPTOUT, search_engine: SEARCH_ENGINES.PRODUCTION, pathname: window.location.pathname })
  }

  return { optedIn, optIn, optOut }
}
