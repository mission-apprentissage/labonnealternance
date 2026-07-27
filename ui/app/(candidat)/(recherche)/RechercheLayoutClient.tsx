"use client"

import { createContext, type ReactNode, useContext } from "react"

import { useIsWidget as useDetectWidget } from "@/app/hooks/useIsWidget"

const IsWidgetContext = createContext(false)

// Lecture de la détection widget partagée à tout le sous-arbre recherche (une seule détection pour N consommateurs).
export function useIsWidget() {
  return useContext(IsWidgetContext)
}

export function RechercheLayoutClient({ header, children }: { header: ReactNode; children: ReactNode }) {
  // initialValue=true : la recherche est majoritairement embarquée en widget, on évite d'afficher brièvement la nav.
  const isWidget = useDetectWidget(true)

  return (
    <IsWidgetContext.Provider value={isWidget}>
      {!isWidget && header}
      {children}
    </IsWidgetContext.Provider>
  )
}
