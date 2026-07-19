"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box } from "@mui/material"
import { useMemo } from "react"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchChipOptionRow, SearchFilterChip } from "./SearchFilterChip"

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
  /** Compteur d'offres handi-accueillantes (counts.is_disabled_elligible de l'API) — seul filtre avec compteur. */
  handiCount?: number
  onNavigate: (newParams: ISearchPageParams) => void
  /** "bar" : rangée de chips desktop ; "sections" : panneau mobile (cases empilées). */
  variant?: "bar" | "sections"
}

// Valeurs de niveau « indifférentes » (toujours incluses côté API) : pas des options de filtre.
const LEVEL_AGNOSTIC_VALUES = new Set(["", "Indifférent"])

// Ordre pédagogique Cap → Bac+5 (l'ordre alphabétique mélange les niveaux).
const levelRank = (label: string): number => {
  if (/infrabac/i.test(label)) return 1
  if (/\(bac\)/i.test(label)) return 2
  if (/bac\+2/i.test(label)) return 3
  if (/bac\+3/i.test(label)) return 4
  if (/bac\+5/i.test(label)) return 5
  return 99
}

/** Options d'un filtre : valeurs des facettes + valeurs sélectionnées (toujours démontables). */
function buildOptionValues(counts?: Record<string, number>, selected: string[] = []): string[] {
  return [...new Set([...Object.keys(counts ?? {}), ...selected])]
}

/** Libellé de chip multi-valeurs : « Apprentissage, +1 ». */
const multiLabel = (values: string[]): string => (values.length > 1 ? `${values[0]}, +${values.length - 1}` : values[0])

const formatDateFr = (isoDate: string): string => isoDate.split("-").reverse().join("/")

const isFutureDate = (isoDate?: string): boolean => {
  if (!isoDate) return false
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return isoDate > todayIso
}

const TYPE_FILTER_LABEL_DISTANCE = "Formation à distance"

// Popper à checkboxes : neutralise les marges basses du fieldset DSFR (1rem sur le fieldset
// ET sur son dernier élément) pour retomber sur le padding vertical du panneau (8px),
// identique aux poppers mono-choix.
const CHECKBOX_POPPER_SX = {
  px: "16px",
  pt: "8px",
  "& .fr-fieldset": { mb: 0 },
  "& .fr-fieldset__element:last-child": { mb: 0 },
}

/** Les filtres remis à zéro par « Réinitialiser les filtres » (q, lieu, mode et tri conservés). */
export function clearedFilters(params: ISearchPageParams): ISearchPageParams {
  return {
    ...params,
    type_filter_label: undefined,
    contract_type: undefined,
    level: undefined,
    activity_sector: undefined,
    organization_name: undefined,
    start_date: undefined,
    urgent: undefined,
    handi: undefined,
    smart_apply: undefined,
    is_algo_company: undefined,
    page: 0,
  }
}

export function hasActiveFilters(params: ISearchPageParams): boolean {
  return Boolean(
    params.type_filter_label?.length ||
      params.contract_type?.length ||
      params.level?.length ||
      params.activity_sector?.length ||
      params.organization_name ||
      params.start_date ||
      params.urgent !== undefined ||
      params.handi !== undefined ||
      params.smart_apply !== undefined ||
      params.is_algo_company !== undefined
  )
}

/** Section de cases à cocher inline (panneau mobile — refonte complète au lot mobile). */
function CheckboxSection({ title, options, value, onChange }: { title: string; options: string[]; value: string[]; onChange: (vals: string[]) => void }) {
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  return (
    <Box sx={{ py: fr.spacing("2v"), borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}>
      <Box component="h3" className={fr.cx("fr-h6")} sx={{ margin: 0, mb: fr.spacing("2v") }}>
        {title}
      </Box>
      {options.length === 0 && <Box sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.disabled.grey.default }}>Aucune option disponible</Box>}
      {options.length > 0 && (
        <Checkbox
          small
          options={options.map((option) => ({
            label: option,
            nativeInputProps: { checked: value.includes(option), onChange: () => toggle(option) },
          }))}
        />
      )}
    </Box>
  )
}

export function SearchFilters({ params, facets, handiCount, onNavigate, variant = "bar" }: SearchFiltersProps) {
  const navigate = (patch: Partial<ISearchPageParams>) => onNavigate({ ...params, ...patch, page: 0 })

  const contractOptions = useMemo(
    () => buildOptionValues(facets?.contract_type, params.contract_type).sort((a, b) => a.localeCompare(b, "fr")),
    [facets?.contract_type, params.contract_type]
  )
  const levelOptions = useMemo(
    () =>
      buildOptionValues(facets?.level, params.level)
        .filter((v) => !LEVEL_AGNOSTIC_VALUES.has(v))
        .sort((a, b) => levelRank(a) - levelRank(b)),
    [facets?.level, params.level]
  )

  if (variant === "sections") {
    return (
      <Box>
        <CheckboxSection
          title="Contrat"
          options={contractOptions}
          value={params.contract_type ?? []}
          onChange={(vals) => navigate({ contract_type: vals.length ? vals : undefined })}
        />
        <CheckboxSection title="Niveau" options={levelOptions} value={params.level ?? []} onChange={(vals) => navigate({ level: vals.length ? vals : undefined })} />
      </Box>
    )
  }

  const isFormations = params.mode === "formations"
  const selectedLevel = params.level?.[0]
  const futureStartDate = isFutureDate(params.start_date)

  // Type d'offres : 2 cases dérivées du param is_algo_company (false = offres, true =
  // entreprises à contacter). Cocher la seconde case = retirer le filtre (les deux ensemble
  // équivalent à « tout »).
  const offresChecked = params.is_algo_company === false
  const entreprisesChecked = params.is_algo_company === true
  const toggleOfferKind = (kind: "offres" | "entreprises") => {
    const target = kind === "offres" ? false : true
    navigate({ is_algo_company: params.is_algo_company === target ? undefined : params.is_algo_company === undefined ? target : undefined })
  }

  const distanceActive = params.type_filter_label?.includes(TYPE_FILTER_LABEL_DISTANCE) ?? false

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v"), alignItems: "center" }}>
      {!isFormations && params.mode === "emplois" && (
        <SearchFilterChip
          label="Type d'offres d'emploi"
          activeLabel={offresChecked ? "Offres d'emploi en alternance" : "Entreprises à contacter"}
          active={params.is_algo_company !== undefined}
          popperContent={
            <Box sx={CHECKBOX_POPPER_SX}>
              <Checkbox
                small
                options={[
                  {
                    label: "Offres d'emploi en alternance",
                    nativeInputProps: { checked: offresChecked, onChange: () => toggleOfferKind("offres") },
                  },
                  {
                    label: "Entreprises à contacter",
                    hintText: "Vous pouvez leur adresser vos candidatures spontanées",
                    nativeInputProps: { checked: entreprisesChecked, onChange: () => toggleOfferKind("entreprises") },
                  },
                ]}
              />
            </Box>
          }
        />
      )}

      {!isFormations && (
        <SearchFilterChip
          label="Date de début de contrat"
          activeLabel={params.start_date ? `À partir du ${formatDateFr(params.start_date)}` : undefined}
          active={Boolean(params.start_date)}
          popperContent={
            <Box sx={{ px: "16px", pt: "8px" }}>
              <Input
                label="À partir du"
                nativeInputProps={{
                  type: "date",
                  value: params.start_date ?? "",
                  onChange: (e) => {
                    const value = e.target.value || undefined
                    // Date future : « Recrutement urgent » (dès que possible) n'a plus de sens → retiré.
                    navigate({ start_date: value, urgent: isFutureDate(value) ? undefined : params.urgent })
                  },
                }}
              />
            </Box>
          }
        />
      )}

      <SearchFilterChip
        label="Niveau d'études visé"
        activeLabel={selectedLevel}
        active={Boolean(selectedLevel)}
        popperContent={
          <Box>
            {levelOptions.map((option) => (
              <SearchChipOptionRow
                key={option}
                label={option}
                selected={option === selectedLevel}
                onSelect={() => navigate({ level: option === selectedLevel ? undefined : [option] })}
              />
            ))}
            {levelOptions.length === 0 && (
              <Box sx={{ px: "16px", py: "8px", fontSize: "0.875rem", color: fr.colors.decisions.text.disabled.grey.default }}>Aucune option disponible</Box>
            )}
          </Box>
        }
      />

      {!isFormations && (
        <SearchFilterChip
          label="Type de contrat"
          activeLabel={params.contract_type?.length ? multiLabel(params.contract_type) : undefined}
          active={Boolean(params.contract_type?.length)}
          popperContent={
            <Box sx={CHECKBOX_POPPER_SX}>
              <Checkbox
                small
                options={contractOptions.map((option) => ({
                  label: option,
                  nativeInputProps: {
                    checked: params.contract_type?.includes(option) ?? false,
                    onChange: () => {
                      const current = params.contract_type ?? []
                      const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option]
                      navigate({ contract_type: next.length ? next : undefined })
                    },
                  },
                }))}
              />
            </Box>
          }
        />
      )}

      {!isFormations && (
        <>
          <SearchFilterChip
            label={`Employeur handi-accueillant${handiCount !== undefined ? ` (${handiCount})` : ""}`}
            active={params.handi === true}
            onToggle={() => navigate({ handi: params.handi ? undefined : true })}
          />
          <SearchFilterChip
            label="Recrutement urgent"
            active={params.urgent === true}
            disabled={futureStartDate}
            onToggle={() => navigate({ urgent: params.urgent ? undefined : true })}
          />
          <SearchFilterChip label="Candidature simplifiée" active={params.smart_apply === true} onToggle={() => navigate({ smart_apply: params.smart_apply ? undefined : true })} />
        </>
      )}

      {isFormations && (
        <SearchFilterChip
          label="Formations à distance"
          active={distanceActive}
          onToggle={() => navigate({ type_filter_label: distanceActive ? undefined : [TYPE_FILTER_LABEL_DISTANCE] })}
        />
      )}

      {hasActiveFilters(params) && (
        <Box component="button" type="button" className={fr.cx("fr-link", "fr-link--sm")} onClick={() => onNavigate(clearedFilters(params))} sx={{ ml: fr.spacing("2v") }}>
          Réinitialiser les filtres
        </Box>
      )}
    </Box>
  )
}
