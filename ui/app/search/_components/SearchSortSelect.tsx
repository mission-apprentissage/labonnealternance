"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, MenuItem, Select } from "@mui/material"

import type { ISearchPageParams, SortOption } from "../_utils/search.params.utils"

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: "proximity", label: "Proximité" },
  { value: "smart_apply", label: "Candidature simplifiée" },
  { value: "date", label: "Date de publication" },
]

/**
 * Select « Trier par » (sans libellé au-dessus). Pilote le param `sort` de l'URL.
 * « Proximité » n'a de sens qu'avec un lieu (géo) → désactivée sinon.
 */
export function SearchSortSelect({ params, onNavigate }: { params: ISearchPageParams; onNavigate: (newParams: ISearchPageParams) => void }) {
  const hasGeo = params.latitude !== undefined && params.longitude !== undefined

  return (
    <FormControl size="small" sx={{ flexShrink: 0, width: 300 }}>
      <Select
        id="search-sort"
        displayEmpty
        value={params.sort ?? ""}
        onChange={(e) => onNavigate({ ...params, sort: (e.target.value as SortOption) || undefined, page: 0 })}
        renderValue={(value) => {
          const selected = SORT_LABELS.find((o) => o.value === value)
          return (
            <Box
              component="span"
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: selected ? undefined : fr.colors.decisions.text.mention.grey.default,
              }}
            >
              {selected ? `Trier par : ${selected.label}` : "Trier par"}
            </Box>
          )
        }}
        MenuProps={{ PaperProps: { sx: { minWidth: 240 } } }}
        sx={{ height: 40, ".MuiSelect-select": { display: "flex", alignItems: "center", py: "8px" } }}
      >
        {SORT_LABELS.map((o) => (
          <MenuItem key={o.value} value={o.value} disabled={o.value === "proximity" && !hasGeo} sx={{ fontSize: "0.875rem" }}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
