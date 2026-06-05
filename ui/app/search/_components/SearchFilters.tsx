"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box } from "@mui/material"
import { useMemo } from "react"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildTypeGroups } from "../_utils/search.type-groups"
import { SearchEntrepriseAutocomplete } from "./SearchEntrepriseAutocomplete"
import type { MultiSelectGroup, MultiSelectOption } from "./SearchMultiSelectField"
import { SearchMultiSelectField } from "./SearchMultiSelectField"

interface FacetCounts {
  type?: Record<string, number>
  type_filter_label?: Record<string, number>
  contract_type?: Record<string, number>
  level?: Record<string, number>
  activity_sector?: Record<string, number>
  organization_name?: Record<string, number>
}

interface SearchFiltersProps {
  params: ISearchPageParams
  facets?: FacetCounts
  onNavigate: (newParams: ISearchPageParams) => void
  /** "bar" : barre desktop (dropdowns) ; "sections" : panneau mobile (cases empilées). */
  variant?: "bar" | "sections"
}

/** Construit les options (valeur/label/compteur) en incluant toujours les valeurs sélectionnées. */
function buildOptions(counts?: Record<string, number>, selected: string[] = []): MultiSelectOption[] {
  const map = new Map<string, number | undefined>()
  for (const [value, count] of Object.entries(counts ?? {})) map.set(value, count)
  for (const value of selected) if (!map.has(value)) map.set(value, undefined)
  return [...map.entries()].map(([value, count]) => ({ value, label: value, count }))
}

function sortAlpha(options: MultiSelectOption[]): MultiSelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, "fr"))
}

/** Section de cases à cocher inline (panneau mobile), avec sous-groupes optionnels. */
function CheckboxSection({
  title,
  options,
  groups,
  value,
  onChange,
}: {
  title: string
  options?: MultiSelectOption[]
  groups?: MultiSelectGroup[]
  value: string[]
  onChange: (vals: string[]) => void
}) {
  const renderGroups: MultiSelectGroup[] = groups ? groups.map((g) => ({ label: g.label, options: sortAlpha(g.options) })) : [{ label: "", options: sortAlpha(options ?? []) }]
  const isEmpty = renderGroups.every((g) => g.options.length === 0)

  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  return (
    <Box sx={{ py: fr.spacing("2v"), borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}>
      <Box component="h3" className={fr.cx("fr-h6")} sx={{ margin: 0, mb: fr.spacing("2v") }}>
        {title}
      </Box>
      {isEmpty && <Box sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.disabled.grey.default }}>Aucune option disponible</Box>}
      {renderGroups.map((group) => (
        <Box key={group.label || "__flat__"}>
          {group.label && (
            <Box
              sx={{
                pt: fr.spacing("1v"),
                pb: fr.spacing("1v"),
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: fr.colors.decisions.text.mention.grey.default,
              }}
            >
              {group.label}
            </Box>
          )}
          {group.options.length > 0 && (
            <Checkbox
              small
              options={group.options.map((option) => ({
                label: option.label,
                nativeInputProps: {
                  checked: value.includes(option.value),
                  onChange: () => toggle(option.value),
                },
              }))}
            />
          )}
        </Box>
      ))}
    </Box>
  )
}

export function SearchFilters({ params, facets, onNavigate, variant = "bar" }: SearchFiltersProps) {
  // Facettes dynamiques/synchronisées : on utilise directement les compteurs renvoyés par
  // l'API (faceting disjonctif). Les options indisponibles n'apparaissent plus ; les valeurs
  // sélectionnées sont toujours incluses (pour pouvoir les retirer).
  const typeOptions = useMemo(() => buildOptions(facets?.type_filter_label, params.type_filter_label), [facets?.type_filter_label, params.type_filter_label])
  const typeGroups = useMemo(() => buildTypeGroups(typeOptions), [typeOptions])
  const contractOptions = useMemo(() => buildOptions(facets?.contract_type, params.contract_type), [facets?.contract_type, params.contract_type])
  const levelOptions = useMemo(() => buildOptions(facets?.level, params.level), [facets?.level, params.level])
  const sectorOptions = useMemo(() => buildOptions(facets?.activity_sector, params.activity_sector), [facets?.activity_sector, params.activity_sector])
  const entrepriseOptions = useMemo(() => Object.keys(facets?.organization_name ?? {}), [facets?.organization_name])

  const setMulti = (key: "type_filter_label" | "contract_type" | "level" | "activity_sector") => (vals: string[]) =>
    onNavigate({ ...params, [key]: vals.length ? vals : undefined, page: 0 })

  const setEntreprise = (name: string | null) => onNavigate({ ...params, organization_name: name ?? undefined, page: 0 })

  if (variant === "sections") {
    return (
      <Box>
        <CheckboxSection title="Type" groups={typeGroups} value={params.type_filter_label ?? []} onChange={setMulti("type_filter_label")} />
        <CheckboxSection title="Contrat" options={contractOptions} value={params.contract_type ?? []} onChange={setMulti("contract_type")} />
        <CheckboxSection title="Niveau" options={levelOptions} value={params.level ?? []} onChange={setMulti("level")} />
        <CheckboxSection title="Secteur" options={sectorOptions} value={params.activity_sector ?? []} onChange={setMulti("activity_sector")} />
        <Box sx={{ py: fr.spacing("2v") }}>
          <Box component="h3" className={fr.cx("fr-h6")} sx={{ margin: 0, mb: fr.spacing("2v") }}>
            Entreprise
          </Box>
          <SearchEntrepriseAutocomplete options={entrepriseOptions} value={params.organization_name} onChange={setEntreprise} fullWidth />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("3v"), alignItems: "flex-end" }}>
      <SearchMultiSelectField id="filter-type" label="Type" groups={typeGroups} value={params.type_filter_label ?? []} onChange={setMulti("type_filter_label")} />
      <SearchMultiSelectField id="filter-contract" label="Contrat" options={contractOptions} value={params.contract_type ?? []} onChange={setMulti("contract_type")} />
      <SearchMultiSelectField id="filter-level" label="Niveau" options={levelOptions} value={params.level ?? []} onChange={setMulti("level")} />
      <SearchMultiSelectField id="filter-sector" label="Secteur" options={sectorOptions} value={params.activity_sector ?? []} onChange={setMulti("activity_sector")} />
      <SearchEntrepriseAutocomplete options={entrepriseOptions} value={params.organization_name} onChange={setEntreprise} />
    </Box>
  )
}
