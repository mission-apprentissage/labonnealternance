"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, MenuItem, Select } from "@mui/material"

import type { ISearchPageParams, SortOption } from "../_utils/search.params.utils"

// "" = tri par défaut (pertinence) : permet de RETIRER un tri actif.
const SORT_LABELS: { value: SortOption | ""; label: string }[] = [
  { value: "", label: "Les plus pertinentes" },
  { value: "proximity", label: "Proximité avec le lieu de recherche" },
  { value: "date", label: "Les offres les plus récentes" },
  { value: "applications", label: "Les offres avec le moins de candidatures" },
  { value: "start_date", label: "Date de début de contrat" },
]

// Mode « Formations uniquement » : seuls pertinence et proximité ont un sens (pas de date de
// publication fiable, pas de candidatures ni de date de début côté formations).
const FORMATION_SORTS = new Set<SortOption | "">(["", "proximity"])

/**
 * Select « Trier par » (label au-dessus, valeur affichée dans le champ). Pilote le param
 * `sort` de l'URL. « Proximité » n'a de sens qu'avec un lieu (géo) → désactivée sinon.
 */
export function SearchSortSelect({ params, onNavigate }: { params: ISearchPageParams; onNavigate: (newParams: ISearchPageParams) => void }) {
  const hasGeo = params.latitude !== undefined && params.longitude !== undefined
  const options = params.mode === "formations" ? SORT_LABELS.filter((o) => FORMATION_SORTS.has(o.value)) : SORT_LABELS

  return (
    <FormControl size="small" sx={{ flexShrink: 0, minWidth: 240 }}>
      <Box
        component="label"
        id="search-sort-label"
        sx={{ display: "block", fontWeight: 700, fontSize: "1rem", mb: fr.spacing("1v"), color: fr.colors.decisions.text.default.grey.default }}
      >
        Trier par
      </Box>
      <Select
        labelId="search-sort-label"
        id="search-sort"
        displayEmpty
        value={params.sort ?? ""}
        onChange={(e) => onNavigate({ ...params, sort: (e.target.value as SortOption) || undefined, page: 0 })}
        renderValue={(value) => {
          const selected = SORT_LABELS.find((o) => o.value === value) ?? SORT_LABELS[0]
          return (
            <Box component="span" sx={{ fontSize: "1rem", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected.label}
            </Box>
          )
        }}
        MenuProps={{ PaperProps: { elevation: 0, sx: { mt: "4px", borderRadius: "4px", py: "8px", minWidth: 280, boxShadow: "0 6px 18px rgba(0,0,18,0.16)" } } }}
        sx={{
          height: 48,
          borderRadius: "4px",
          backgroundColor: "#FFFFFF",
          ".MuiSelect-select": { display: "flex", alignItems: "center", py: "8px" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: fr.colors.decisions.border.default.grey.default, borderWidth: 1 },
        }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value} disabled={o.value === "proximity" && !hasGeo} sx={{ fontSize: "1rem" }}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
