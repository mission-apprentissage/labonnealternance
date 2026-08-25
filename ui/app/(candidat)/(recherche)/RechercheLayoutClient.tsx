"use client"

import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import { createContext, type ReactNode, useContext } from "react"
import { useIsWidget as useDetectWidget } from "@/app/hooks/use-is-widget"

const IsWidgetContext = createContext(false)

// Lecture de la détection widget partagée à tout le sous-arbre recherche (une seule détection pour N consommateurs).
export function useIsWidget() {
  return useContext(IsWidgetContext)
}

export function RechercheLayoutClient({ header, children }: { header: ReactNode; children: ReactNode }) {
  // initialValue=true : la recherche est majoritairement embarquée en widget, on évite d'afficher brièvement la nav.
  const isWidget = useDetectWidget(true)

  // En widget, le header (et donc #header-links) n'est pas rendu : le lien "Menu" ciblerait une ancre inexistante.
  const menuLink = isWidget ? [] : [{ label: "Menu", anchor: "#header-links" }]
  const footerLink = [{ label: "Pied de page", anchor: "#footer-links" }]

  return (
    <>
      {/* Deux jeux de SkipLinks selon le breakpoint : desktop et mobile sont deux arbres DOM
              disjoints (l'un `display: none` selon la largeur, cf. plus bas) — un seul id ne peut
              pas cibler les deux à la fois, donc chaque jeu pointe vers les ids de SA branche et
              n'est lui-même atteignable au clavier que sur son propre breakpoint. */}
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <SkipLinks
          links={[...menuLink, { label: "Recherche", anchor: "#search-form" }, { label: "Résultat de la recherche", anchor: "#search-content-container" }, ...footerLink]}
        />
      </Box>
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <SkipLinks
          links={[
            ...menuLink,
            { label: "Recherche", anchor: "#search-form-mobile" },
            { label: "Résultat de la recherche", anchor: "#search-content-container-mobile" },
            ...footerLink,
          ]}
        />
      </Box>

      <IsWidgetContext.Provider value={isWidget}>
        {!isWidget && header}
        {children}
      </IsWidgetContext.Provider>
    </>
  )
}
