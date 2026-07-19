"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, ButtonBase } from "@mui/material"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchFilterChip } from "./SearchFilterChip"
import { SEARCH_MODE_OPTIONS } from "./SearchTypeRechercheSelect"

interface SearchMobileSummaryBarProps {
  params: ISearchPageParams
  activeFilterCount: number
  onOpenSearch: () => void
  onOpenFilters: () => void
  onOpenTri: () => void
}

/**
 * Barre mobile du design « Nouvelle recherche » : résumé de la recherche sur 2 lignes
 * (ouvre la modale Recherche) puis chips « Filtres (n) » et « Tri » (modales dédiées).
 */
export function SearchMobileSummaryBar({ params, activeFilterCount, onOpenSearch, onOpenFilters, onOpenTri }: SearchMobileSummaryBarProps) {
  const modeLabel = SEARCH_MODE_OPTIONS.find((o) => o.value === params.mode)?.label ?? ""

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("2v") }}>
      <ButtonBase
        onClick={onOpenSearch}
        aria-haspopup="dialog"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          width: "100%",
          px: fr.spacing("3v"),
          py: fr.spacing("2v"),
          backgroundColor: "#FFFFFF",
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "4px",
          "&:focus-visible": { outline: "2px solid #0a76f6", outlineOffset: 2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              fontSize: "1rem",
              color: params.q ? fr.colors.decisions.text.default.grey.default : fr.colors.decisions.text.mention.grey.default,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {params.q || "Recherche par mot clé"}
          </Box>
          <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {params.lieu_label ?? "France entière"} - {modeLabel}
          </Box>
        </Box>
        <Box component="span" className={fr.cx("fr-icon-search-line")} sx={{ color: fr.colors.decisions.text.mention.grey.default, flexShrink: 0 }} aria-hidden="true" />
      </ButtonBase>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SearchFilterChip label="Filtres" activeLabel={`Filtres (${activeFilterCount})`} active={activeFilterCount > 0} dialogTrigger onToggle={onOpenFilters} />
        <SearchFilterChip label="Tri" active={false} dialogTrigger onToggle={onOpenTri} />
      </Box>
    </Box>
  )
}
