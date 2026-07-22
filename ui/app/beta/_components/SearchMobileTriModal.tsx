"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box } from "@mui/material"
import { useState } from "react"

import type { ISearchPageParams, SortOption } from "../_utils/search.params.utils"
import { FORMATION_SORTS, SORT_LABELS } from "./SearchSortSelect"

interface SearchMobileTriModalProps {
  params: ISearchPageParams
  onNavigate: (newParams: ISearchPageParams) => void
  onClose: () => void
}

/**
 * Modale Tri mobile : bottom-sheet (backdrop sombre + panneau ancré en bas) avec radios.
 * Contrairement au desktop, l'application est DIFFÉRÉE : le tri choisi ne s'applique
 * qu'au clic sur « Appliquer ».
 */
export function SearchMobileTriModal({ params, onNavigate, onClose }: SearchMobileTriModalProps) {
  const [selected, setSelected] = useState<SortOption | "">(params.sort ?? "")
  const hasGeo = params.latitude !== undefined && params.longitude !== undefined
  const options = params.mode === "formations" ? SORT_LABELS.filter((o) => FORMATION_SORTS.has(o.value)) : SORT_LABELS

  const apply = () => {
    onNavigate({ ...params, sort: selected || undefined, page: 0 })
    onClose()
  }

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 1250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop décoratif (clic = fermer) — la fermeture clavier passe par le bouton Fermer. */}
      <Box onClick={onClose} sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(22,22,22,0.64)" }} aria-hidden="true" />
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Tri"
        sx={{
          position: "relative",
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          borderRadius: "8px 8px 0 0",
          px: fr.spacing("4v"),
          pt: fr.spacing("3v"),
          pb: fr.spacing("4v"),
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button priority="tertiary no outline" iconId="fr-icon-close-line" iconPosition="right" onClick={onClose}>
            Fermer
          </Button>
        </Box>
        <Box component="h2" sx={{ margin: 0, mb: fr.spacing("3v"), fontSize: "1.25rem", fontWeight: 700 }}>
          Tri
        </Box>
        <RadioButtons
          small
          legend="Trier par :"
          options={options.map((o) => ({
            label: o.label,
            nativeInputProps: {
              checked: selected === o.value,
              disabled: o.value === "proximity" && !hasGeo,
              onChange: () => setSelected(o.value),
            },
          }))}
        />
        <Button priority="primary" onClick={apply} style={{ width: "100%", justifyContent: "center" }}>
          Appliquer
        </Button>
      </Box>
    </Box>
  )
}
