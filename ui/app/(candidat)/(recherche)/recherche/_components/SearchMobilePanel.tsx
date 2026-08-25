"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import type { ReactNode } from "react"

import { useDialogA11y } from "../_hooks/use-dialog-a11y"
import { useLockBodyScroll } from "../_hooks/use-lock-body-scroll"
import { useVisualViewportSize } from "../_hooks/use-visual-viewport-size"

interface SearchMobilePanelProps {
  /** Sans titre : header réduit au bouton « Fermer » aligné à droite (modale de la home). */
  title?: string
  /** Libellé accessibilité quand `title` est absent. */
  ariaLabel?: string
  /**
   * Masque le header (titre + Fermer) — écran de saisie : le champ focus doit être tout en
   * haut pour maximiser l'espace des suggestions au-dessus du clavier. `display: none`
   * (pas de démontage) : le focus trap ignore déjà les éléments non visibles.
   */
  hideHeader?: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Panneau mobile plein écran (recherche / filtres). Remplace le `Drawer`
 * unique du POC. Head titre + croix, body scrollable, footer sticky optionnel.
 */
export function SearchMobilePanel({ title, ariaLabel, hideHeader = false, onClose, children, footer }: SearchMobilePanelProps) {
  useLockBodyScroll()
  const dialogRef = useDialogA11y(onClose)
  const viewport = useVisualViewportSize()

  return (
    <Box
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? ariaLabel}
      sx={{
        position: "fixed",
        // Suivi du viewport VISUEL, pas `inset: 0` : le clavier virtuel recouvre le bas du
        // layout viewport — un panneau pleine hauteur y laisserait la liste de suggestions
        // et le footer masqués. top : iOS décale le viewport visuel (offsetTop) pour amener
        // le champ focus en vue — décalage via `top` et non `transform`, déjà utilisé par
        // l'animation d'ouverture (conflit pendant sa lecture).
        top: viewport.offsetTop ? `${viewport.offsetTop}px` : 0,
        left: 0,
        right: 0,
        height: viewport.height !== null ? `${viewport.height}px` : "100%",
        // Sous le niveau "modal" (1300) pour que les dropdowns des Autocomplete
        // (MUI Popper) et de l'autocomplete Entreprise (downshift) passent devant.
        zIndex: 1250,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
        // Effet tiroir à l'ouverture (bas → haut).
        "@keyframes search-panel-slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        animation: "search-panel-slide-up 0.25s ease-out",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box
        sx={{
          flex: "0 0 auto",
          display: hideHeader ? "none" : "flex",
          alignItems: "center",
          justifyContent: title ? "space-between" : "flex-end",
          px: fr.spacing("4v"),
          py: fr.spacing("3v"),
          borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        {title && (
          <Box component="h2" className={fr.cx("fr-h6")} sx={{ margin: 0 }}>
            {title}
          </Box>
        )}
        {title ? (
          <Button priority="tertiary no outline" iconId="fr-icon-close-line" onClick={onClose} title="Fermer" />
        ) : (
          <Button priority="tertiary no outline" iconId="fr-icon-close-line" iconPosition="right" onClick={onClose}>
            Fermer
          </Button>
        )}
      </Box>

      <Box sx={{ flex: "1 1 auto", overflowY: "auto", px: fr.spacing("4v"), py: fr.spacing("4v") }}>{children}</Box>

      {footer && (
        <Box
          sx={{
            flex: "0 0 auto",
            px: fr.spacing("4v"),
            py: fr.spacing("3v"),
            borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            boxShadow: "0 -2px 10px rgba(0,0,18,0.07)",
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  )
}
