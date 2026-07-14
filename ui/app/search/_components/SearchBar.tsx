"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { searchAddress } from "@/services/baseAdresse"
import { apiGet } from "@/utils/api.utils"

function useThrottle(value: string, delay: number) {
  const lastUpdateRef = useRef<number | null>(null)
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const now = Date.now()
    if (lastUpdateRef.current === null || now - lastUpdateRef.current >= delay) {
      lastUpdateRef.current = now
      setDebouncedValue(value)
      return
    }
    const timeout = setTimeout(() => {
      lastUpdateRef.current = now
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}

// Taille de police commune à toute la barre (Métier/Lieu), alignée sur les filtres.
const FIELD_FONT_SIZE = "0.875rem"
const INPUT_SX = { ".MuiInputBase-input": { fontSize: FIELD_FONT_SIZE } }

// Restylage DSFR des champs : fond gris contrasté + bordure basse (bleue si rempli), sans contour MUI.
const dsfrFieldSx = (active: boolean) => ({
  ...INPUT_SX,
  ".MuiOutlinedInput-root": {
    backgroundColor: active ? fr.colors.decisions.background.contrast.info.default : fr.colors.decisions.background.contrast.grey.default,
    borderRadius: "4px 4px 0 0",
    borderBottom: `2px solid ${active ? fr.colors.decisions.border.actionHigh.blueFrance.default : fr.colors.decisions.border.plain.grey.default}`,
  },
  ".MuiOutlinedInput-notchedOutline": { border: "none" },
  ".MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
  ".MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
})

type LieuOption = { label: string; latitude: number; longitude: number }

interface SearchBarProps {
  initialQ?: string
  initialLieuLabel?: string
  /** source : "suggestion" si l'utilisateur a sélectionné une option d'autocomplete, "free_text" sinon (télémétrie moteur de suggestion). */
  onSubmit: (q: string, source: "suggestion" | "free_text") => void
  onLieuChange: (lieu: { label: string; latitude: number; longitude: number } | null) => void
  /** "row" : barre desktop ; "column" : panneau mobile (sans bouton, géré par le footer). */
  layout?: "row" | "column"
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box component="label" sx={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}>
      {children}
    </Box>
  )
}

export function SearchBar({ initialQ = "", initialLieuLabel, onSubmit, onLieuChange, layout = "row" }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQ)
  const [lieuInput, setLieuInput] = useState(initialLieuLabel ?? "")
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)

  const debouncedInput = useThrottle(inputValue, 300)
  const debouncedLieu = useThrottle(lieuInput, 300)

  const isColumn = layout === "column"

  // Suggestions pour le champ métier — autocomplétion par préfixe (endpoint dédié, min 3 caractères)
  const { data: suggestionData } = useQuery({
    queryKey: ["/v1/search/suggest", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search/suggest", { querystring: { q: debouncedInput, limit: 8 } }, { signal }),
    enabled: debouncedInput.length >= 3,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions = suggestionData?.suggestions ?? []

  // Suggestions pour le champ lieu
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

  const handleSubmit = useCallback(
    (value: string, source: "suggestion" | "free_text") => {
      onSubmit(value, source)
    },
    [onSubmit]
  )

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isColumn ? "column" : "row",
        gap: isColumn ? fr.spacing("4v") : fr.spacing("3v"),
        alignItems: isColumn ? "stretch" : "flex-end",
      }}
    >
      {/* Champ métier */}
      <Box sx={{ flex: isColumn ? "none" : 2, width: isColumn ? "100%" : undefined }}>
        <FieldLabel>Métier ou formation</FieldLabel>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={inputValue}
          onInputChange={(_e, value) => {
            setInputValue(value)
            if (value === "") handleSubmit("", "free_text")
          }}
          onChange={(_e, value) => {
            // onChange de l'Autocomplete = sélection d'une option de la liste → source "suggestion"
            if (typeof value === "string" && value) {
              handleSubmit(value, "suggestion")
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Rechercher un métier, une compétence..."
              variant="outlined"
              size="small"
              fullWidth
              sx={dsfrFieldSx(inputValue.trim().length > 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(inputValue, "free_text")
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Box component="span" className={fr.cx("fr-icon-search-line")} sx={{ mr: fr.spacing("1v"), color: fr.colors.decisions.text.mention.grey.default }} />
                ),
              }}
            />
          )}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
      </Box>

      {/* Champ lieu */}
      <Box sx={{ flex: isColumn ? "none" : "0 0 320px", width: isColumn ? "100%" : undefined }}>
        <FieldLabel>Lieu</FieldLabel>
        <Autocomplete
          freeSolo
          options={lieuSuggestions}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
          isOptionEqualToValue={(o, v) => (typeof v === "string" ? o.label === v : o.label === v.label)}
          inputValue={lieuInput}
          value={lieuValue}
          onInputChange={(_e, value, reason) => {
            setLieuInput(value)
            // "clear" = clic sur la croix MUI — on retire le lieu des params
            // "reset" peut se déclencher à l'hydration, on l'ignore volontairement
            if (reason === "clear") {
              setLieuValue(null)
              onLieuChange(null)
            }
          }}
          onChange={(_e, value) => {
            if (value && typeof value !== "string") {
              setLieuValue(value)
              onLieuChange(value)
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Ville, code postal..."
              variant="outlined"
              size="small"
              fullWidth
              sx={dsfrFieldSx(lieuInput.trim().length > 0)}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Box component="span" className={fr.cx("fr-icon-map-pin-2-line")} sx={{ mr: fr.spacing("1v"), color: fr.colors.decisions.text.mention.grey.default }} />
                ),
              }}
            />
          )}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
      </Box>
    </Box>
  )
}
