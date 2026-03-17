"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, Chip, Drawer, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, useMediaQuery, useTheme } from "@mui/material"
import { useState } from "react"

import type { ISearchPageParams } from "../_utils/search.params.utils"

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
}

const RADIUS_OPTIONS = [10, 30, 60, 100]

function buildOptions(counts?: Record<string, number>): Array<{ value: string; label: string }> {
  if (!counts) return []
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([value, count]) => ({ value, label: `${value} (${count})` }))
}

const SELECT_SX = {
  minWidth: 140,
  height: 36,
  fontSize: "0.875rem",
  ".MuiSelect-select": { py: "6px" },
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (vals: string[]) => void
}) {
  if (!options.length) return null

  return (
    <FormControl size="small" sx={SELECT_SX}>
      <InputLabel sx={{ fontSize: "0.875rem" }}>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          onChange(typeof raw === "string" ? raw.split(",") : raw)
        }}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) =>
          selected.length === 0 ? (
            <span style={{ color: "#777" }}>Tous</span>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
              {selected.map((v) => (
                <Chip key={v} label={v} size="small" sx={{ height: 20, fontSize: "0.75rem" }} />
              ))}
            </Box>
          )
        }
        MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value} dense>
            <Checkbox checked={value.includes(o.value)} size="small" />
            <ListItemText primary={o.label} primaryTypographyProps={{ fontSize: "0.875rem" }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

function FiltersContent({ facets, current, onChange }: { facets?: FacetCounts; current: ISearchPageParams; onChange: (p: ISearchPageParams) => void }) {
  const typeOptions = buildOptions(facets?.type_filter_label)
  const contractOptions = buildOptions(facets?.contract_type)
  const levelOptions = buildOptions(facets?.level)
  const sectorOptions = buildOptions(facets?.activity_sector)

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("3v"), alignItems: "center" }}>
      {/* Rayon — single select */}
      <FormControl size="small" sx={SELECT_SX}>
        <InputLabel sx={{ fontSize: "0.875rem" }}>Rayon</InputLabel>
        <Select value={current.radius} onChange={(e) => onChange({ ...current, radius: Number(e.target.value), page: 0 })} label="Rayon">
          {RADIUS_OPTIONS.map((r) => (
            <MenuItem key={r} value={r} dense>
              <ListItemText primary={`${r} km`} primaryTypographyProps={{ fontSize: "0.875rem" }} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <MultiSelect
        label="Type"
        options={typeOptions}
        value={current.type_filter_label ?? []}
        onChange={(vals) => onChange({ ...current, type_filter_label: vals.length ? vals : undefined, page: 0 })}
      />

      <MultiSelect
        label="Contrat"
        options={contractOptions}
        value={current.contract_type ?? []}
        onChange={(vals) => onChange({ ...current, contract_type: vals.length ? vals : undefined, page: 0 })}
      />

      <MultiSelect
        label="Niveau"
        options={levelOptions}
        value={current.level ?? []}
        onChange={(vals) => onChange({ ...current, level: vals.length ? vals : undefined, page: 0 })}
      />

      <MultiSelect
        label="Secteur"
        options={sectorOptions}
        value={current.activity_sector ?? []}
        onChange={(vals) => onChange({ ...current, activity_sector: vals.length ? vals : undefined, page: 0 })}
      />
    </Box>
  )
}

export function SearchFilters({ params, facets, onNavigate }: SearchFiltersProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localParams, setLocalParams] = useState<ISearchPageParams>(params)

  const activeFilterCount = [params.type_filter_label?.length, params.contract_type?.length, params.level?.length, params.activity_sector?.length, params.organization_name].filter(
    Boolean
  ).length

  if (isMobile) {
    return (
      <>
        <Button
          priority="secondary"
          iconId="fr-icon-settings-5-line"
          onClick={() => {
            setLocalParams(params)
            setDrawerOpen(true)
          }}
          size="small"
        >
          Modifier les filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>

        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              p: fr.spacing("6v"),
              maxHeight: "85vh",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: fr.spacing("4v") }}>
            <h2 className={fr.cx("fr-h5")} style={{ margin: 0 }}>
              Modifier les filtres
            </h2>
            <Button priority="tertiary no outline" iconId="fr-icon-close-line" onClick={() => setDrawerOpen(false)} title="Fermer" />
          </Box>

          <Box sx={{ overflowY: "auto", flex: 1 }}>
            <FiltersContent facets={facets} current={localParams} onChange={setLocalParams} />
          </Box>

          <Box sx={{ mt: fr.spacing("4v") }}>
            <Button
              priority="primary"
              onClick={() => {
                onNavigate(localParams)
                setDrawerOpen(false)
              }}
              style={{ width: "100%" }}
            >
              Appliquer les filtres
            </Button>
          </Box>
        </Drawer>
      </>
    )
  }

  return <FiltersContent facets={facets} current={params} onChange={onNavigate} />
}
