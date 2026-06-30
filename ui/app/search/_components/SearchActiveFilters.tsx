import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Tag } from "@codegouvfr/react-dsfr/Tag"
import { Box } from "@mui/material"

import type { ISearchPageParams } from "../_utils/search.params.utils"

interface SearchActiveFiltersProps {
  params: ISearchPageParams
  onNavigate: (newParams: ISearchPageParams) => void
}

type ArrayFilterKey = "type_filter_label" | "contract_type" | "level" | "activity_sector"

const CATEGORIES: { key: ArrayFilterKey; label: string }[] = [
  { key: "type_filter_label", label: "Type" },
  { key: "contract_type", label: "Contrat" },
  { key: "level", label: "Niveau" },
  { key: "activity_sector", label: "Secteur" },
]

// Tags actifs : fond blue-france-850, police blue-france-sun-113 (tokens DSFR via le helper fr).
const TAG_STYLE = {
  backgroundColor: fr.colors.options.blueFrance._850_200.default,
  color: fr.colors.options.blueFrance.sun113_625.default,
  minHeight: 0,
  lineHeight: 0,
}

export function SearchActiveFilters({ params, onNavigate }: SearchActiveFiltersProps) {
  const groups = CATEGORIES.map(({ key, label }) => ({ key, label, values: params[key] ?? [] })).filter((g) => g.values.length > 0)

  const total = groups.reduce((n, g) => n + g.values.length, 0) + (params.organization_name ? 1 : 0)

  if (total === 0) return null

  function removeFilter(filterKey: ArrayFilterKey, val: string) {
    const newVals = (params[filterKey] ?? []).filter((v) => v !== val)
    onNavigate({ ...params, [filterKey]: newVals.length ? newVals : undefined, page: 0 })
  }

  function removeEntreprise() {
    onNavigate({ ...params, organization_name: undefined, page: 0 })
  }

  function clearAll() {
    onNavigate({ ...params, type_filter_label: undefined, contract_type: undefined, level: undefined, activity_sector: undefined, organization_name: undefined, page: 0 })
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: fr.spacing("4v"),
        mt: fr.spacing("3v"),
        pt: fr.spacing("3v"),
        borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: `${fr.spacing("2v")} ${fr.spacing("5v")}`, flex: 1 }}>
        {groups.map((group) => (
          <Box key={group.key} sx={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v") }}>
            <Box
              component="span"
              sx={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: fr.colors.decisions.text.mention.grey.default }}
            >
              {group.label}
            </Box>
            {group.values.map((value) => (
              <Tag key={value} dismissible style={TAG_STYLE} nativeButtonProps={{ onClick: () => removeFilter(group.key, value) }}>
                {value}
              </Tag>
            ))}
          </Box>
        ))}

        {params.organization_name && (
          <Box sx={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v") }}>
            <Box
              component="span"
              sx={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: fr.colors.decisions.text.mention.grey.default }}
            >
              Entreprise
            </Box>
            <Tag dismissible style={TAG_STYLE} nativeButtonProps={{ onClick: removeEntreprise }}>
              {params.organization_name}
            </Tag>
          </Box>
        )}
      </Box>

      {total > 1 && (
        <Button priority="tertiary no outline" size="small" onClick={clearAll}>
          Effacer tous les filtres
        </Button>
      )}
    </Box>
  )
}
