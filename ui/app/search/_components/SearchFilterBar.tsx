"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, InputAdornment, TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"

import { searchAddress } from "@/services/baseAdresse"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildTypeGroups } from "../_utils/search.type-groups"
import { SearchActiveFilters } from "./SearchActiveFilters"
import { SearchEntrepriseAutocomplete } from "./SearchEntrepriseAutocomplete"
import type { MultiSelectOption } from "./SearchMultiSelectField"
import { SearchMultiSelectField } from "./SearchMultiSelectField"

interface FacetCounts {
  type_filter_label?: Record<string, number>
  contract_type?: Record<string, number>
  level?: Record<string, number>
  activity_sector?: Record<string, number>
  organization_name?: Record<string, number>
}

interface SearchFilterBarProps {
  params: ISearchPageParams
  facets?: FacetCounts
  onNavigate: (newParams: ISearchPageParams) => void
}

const FIELD_FONT_SIZE = "0.875rem"
const INPUT_SX = { ".MuiInputBase-input": { fontSize: FIELD_FONT_SIZE } }
const STABLE_KEYS: (keyof FacetCounts)[] = ["type_filter_label", "contract_type", "level", "activity_sector", "organization_name"]

function buildOptions(counts?: Record<string, number>, selected: string[] = []): MultiSelectOption[] {
  const map = new Map<string, number | undefined>()
  for (const [value, count] of Object.entries(counts ?? {})) map.set(value, count)
  for (const value of selected) if (!map.has(value)) map.set(value, undefined)
  return [...map.entries()].map(([value, count]) => ({ value, label: value, count }))
}

function useThrottle(value: string, delay: number) {
  const lastUpdateRef = useRef<number | null>(null)
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const now = Date.now()
    if (lastUpdateRef.current === null || now - lastUpdateRef.current >= delay) {
      lastUpdateRef.current = now
      setDebounced(value)
      return
    }
    const timeout = setTimeout(() => {
      lastUpdateRef.current = now
      setDebounced(value)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return debounced
}

type LieuOption = { label: string; latitude: number; longitude: number }

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <Box
      component="label"
      htmlFor={htmlFor}
      sx={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}
    >
      {children}
    </Box>
  )
}

/** Barre « une ligne » : Lieu · Distance | Type · Contrat · Niveau · [Plus de filtres → Secteur · Entreprise]. */
export function SearchFilterBar({ params, facets, onNavigate }: SearchFilterBarProps) {
  const [more, setMore] = useState(false)
  const [lieuInput, setLieuInput] = useState(params.lieu_label ?? "")
  const debouncedLieu = useThrottle(lieuInput, 300)

  // Accumulation des facettes vues (compteurs disjoints, options stables).
  const [stableFacets, setStableFacets] = useState<FacetCounts>({})
  useEffect(() => {
    if (!facets) return
    setStableFacets((prev) => {
      const next: FacetCounts = {}
      for (const key of STABLE_KEYS) {
        if (!prev[key] && !facets[key]) continue
        next[key] = { ...prev[key], ...facets[key] }
      }
      return next
    })
  }, [facets])

  const { data: lieuOptions } = useQuery({
    queryKey: ["lieu-suggestions", debouncedLieu],
    queryFn: () => searchAddress(debouncedLieu),
    enabled: debouncedLieu.length >= 2,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const lieuSuggestions: LieuOption[] = (lieuOptions ?? []).map((item) => ({
    label: item.label,
    latitude: item.value.coordinates[1],
    longitude: item.value.coordinates[0],
  }))

  const typeOptions = useMemo(() => buildOptions(stableFacets.type_filter_label, params.type_filter_label), [stableFacets.type_filter_label, params.type_filter_label])
  const typeGroups = useMemo(() => buildTypeGroups(typeOptions), [typeOptions])
  const contractOptions = useMemo(() => buildOptions(stableFacets.contract_type, params.contract_type), [stableFacets.contract_type, params.contract_type])
  const levelOptions = useMemo(() => buildOptions(stableFacets.level, params.level), [stableFacets.level, params.level])
  const sectorOptions = useMemo(() => buildOptions(stableFacets.activity_sector, params.activity_sector), [stableFacets.activity_sector, params.activity_sector])
  const entrepriseOptions = useMemo(() => Object.keys(stableFacets.organization_name ?? {}), [stableFacets.organization_name])

  const moreCount = (params.activity_sector?.length ?? 0) + (params.organization_name ? 1 : 0)

  const setMulti = (key: "type_filter_label" | "contract_type" | "level" | "activity_sector") => (vals: string[]) =>
    onNavigate({ ...params, [key]: vals.length ? vals : undefined, page: 0 })

  function handleLieuSelect(lieu: LieuOption | null) {
    // Nouveau lieu → on repart du rayon le plus étroit (élargissement auto ensuite).
    if (lieu) {
      onNavigate({ ...params, lieu_label: lieu.label, latitude: lieu.latitude, longitude: lieu.longitude, radius: 20, page: 0 })
    } else {
      onNavigate({ ...params, lieu_label: undefined, latitude: undefined, longitude: undefined, radius: 20, page: 0 })
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: fr.spacing("3v") }}>
        {/* Lieu — bouton Rechercher intégré dans le champ via InputAdornment */}
        <Box sx={{ flex: "0 0 360px", minWidth: 300 }}>
          <FieldLabel htmlFor="filter-lieu">Où cherchez-vous une alternance ?</FieldLabel>
          <Autocomplete
            freeSolo
            disableClearable
            fullWidth
            options={lieuSuggestions}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
            isOptionEqualToValue={(o, v) => (typeof v === "string" ? o.label === v : o.label === v.label)}
            inputValue={lieuInput}
            onInputChange={(_e, value) => {
              setLieuInput(value)
              // Champ vidé → on retire le filtre géo (remplace le bouton clear désactivé).
              if (value === "") handleLieuSelect(null)
            }}
            onChange={(_e, value) => {
              if (value && typeof value !== "string") handleLieuSelect(value)
            }}
            renderInput={(p) => (
              <TextField
                {...p}
                id="filter-lieu"
                placeholder="Adresse, ville ou code postal"
                variant="outlined"
                size="small"
                // Bouton seul endAdornment (en flux) + padding droit nul → collé à la bordure droite.
                sx={{ ...INPUT_SX }}
                InputProps={{
                  ...p.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" className={fr.cx("fr-icon-map-pin-2-line")} sx={{ color: fr.colors.decisions.text.mention.grey.default }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ height: "100%", maxHeight: "none", ml: 0 }}>
                      <Button
                        priority="primary"
                        size="small"
                        iconId="fr-icon-search-line"
                        onClick={() => onNavigate({ ...params, page: 0, selected: undefined })}
                        style={{ height: "100%", whiteSpace: "nowrap" }}
                      >
                        Rechercher
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            noOptionsText="Aucune suggestion"
            filterOptions={(x) => x}
          />
        </Box>

        {/* Séparateur */}
        <Box sx={{ alignSelf: "flex-end", width: "1px", height: 32, mb: "6px", mx: fr.spacing("1v"), backgroundColor: fr.colors.decisions.border.default.grey.default }} />

        {/* Filtres primaires + bouton Plus */}
        <Box sx={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: fr.spacing("3v") }}>
          <SearchMultiSelectField
            id="filter-type"
            label="Type"
            topLabel="Type d'offres ou formations"
            groups={typeGroups}
            value={params.type_filter_label ?? []}
            onChange={setMulti("type_filter_label")}
          />
          <SearchMultiSelectField
            id="filter-contract"
            label="Contrat"
            topLabel="Type de contrat"
            options={contractOptions}
            value={params.contract_type ?? []}
            onChange={setMulti("contract_type")}
          />
          <SearchMultiSelectField id="filter-level" label="Niveau" topLabel="Niveau de formation" options={levelOptions} value={params.level ?? []} onChange={setMulti("level")} />
          <Button priority="secondary" iconId={more ? "fr-icon-subtract-line" : "fr-icon-add-line"} onClick={() => setMore((m) => !m)}>
            {!more && moreCount > 0 ? ` (${moreCount})` : null}
          </Button>
        </Box>
      </Box>

      {/* Ligne dépliable : filtres secondaires */}
      {more && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: fr.spacing("3v"),
            mt: fr.spacing("3v"),
            pt: fr.spacing("3v"),
            borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <SearchMultiSelectField
            id="filter-sector"
            label="Secteur"
            topLabel="Secteur d'activité"
            options={sectorOptions}
            value={params.activity_sector ?? []}
            onChange={setMulti("activity_sector")}
          />
          <Box>
            <SearchEntrepriseAutocomplete
              options={entrepriseOptions}
              value={params.organization_name}
              onChange={(name) => onNavigate({ ...params, organization_name: name ?? undefined, page: 0 })}
              topLabel="Entreprise / organisme"
            />
          </Box>
        </Box>
      )}

      <SearchActiveFilters params={params} onNavigate={onNavigate} />
    </Box>
  )
}
