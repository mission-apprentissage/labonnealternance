"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import type { ReactNode } from "react"

interface SearchMobilePanelProps {
  /** Sans titre : header réduit au bouton « Fermer » aligné à droite (modale de la home). */
  title?: string
  /** Libellé accessibilité quand `title` est absent. */
  ariaLabel?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Panneau mobile plein écran (recherche / filtres). Remplace le `Drawer`
 * unique du POC. Head titre + croix, body scrollable, footer sticky optionnel.
 */
export function SearchMobilePanel({ title, ariaLabel, onClose, children, footer }: SearchMobilePanelProps) {
  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={title ?? ariaLabel}
      sx={{
        position: "fixed",
        inset: 0,
        // Sous le niveau "modal" (1300) pour que les dropdowns des Autocomplete
        // (MUI Popper) et de l'autocomplete Entreprise (downshift) passent devant.
        zIndex: 1250,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: "0 0 auto",
          display: "flex",
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
