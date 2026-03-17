import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Chip } from "@mui/material"

import type { ISearchPageParams } from "../_utils/search.params.utils"

interface SearchActiveFiltersProps {
  params: ISearchPageParams
  onNavigate: (newParams: ISearchPageParams) => void
}

type ArrayFilterKey = "type_filter_label" | "contract_type" | "level" | "activity_sector"

const filterLabels: Record<ArrayFilterKey, string> = {
  type_filter_label: "Type",
  contract_type: "Contrat",
  level: "Niveau",
  activity_sector: "Secteur",
}

export function SearchActiveFilters({ params, onNavigate }: SearchActiveFiltersProps) {
  const arrayFilters: ArrayFilterKey[] = ["type_filter_label", "contract_type", "level", "activity_sector"]

  const activeFilters: Array<{ key: string; label: string; value: string; filterKey: ArrayFilterKey }> = []

  for (const key of arrayFilters) {
    for (const val of params[key] ?? []) {
      activeFilters.push({ key: `${key}:${val}`, label: filterLabels[key], value: val, filterKey: key })
    }
  }

  if (activeFilters.length === 0) return null

  function removeFilter(filterKey: ArrayFilterKey, val: string) {
    const newVals = (params[filterKey] ?? []).filter((v) => v !== val)
    onNavigate({ ...params, [filterKey]: newVals.length ? newVals : undefined, page: 0 })
  }

  function clearAll() {
    onNavigate({ ...params, type_filter_label: undefined, contract_type: undefined, level: undefined, activity_sector: undefined, page: 0 })
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v"), mt: fr.spacing("2v") }}>
      {activeFilters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.value}
          onDelete={() => removeFilter(filter.filterKey, filter.value)}
          size="small"
          sx={{
            backgroundColor: fr.colors.decisions.background.contrast.blueCumulus.default,
            color: fr.colors.decisions.text.actionHigh.blueCumulus.default,
            fontWeight: 500,
            fontSize: "0.8125rem",
            "& .MuiChip-deleteIcon": {
              color: fr.colors.decisions.text.actionHigh.blueCumulus.default,
              "&:hover": { color: fr.colors.decisions.text.default.grey.default },
            },
          }}
        />
      ))}
      {activeFilters.length > 1 && (
        <Button priority="tertiary no outline" size="small" onClick={clearAll}>
          Effacer tous les filtres
        </Button>
      )}
    </Box>
  )
}
