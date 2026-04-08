"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
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

type LieuOption = { label: string; latitude: number; longitude: number }

interface SearchBarProps {
  initialQ?: string
  initialLieuLabel?: string
  onSubmit: (q: string) => void
  onLieuChange: (lieu: { label: string; latitude: number; longitude: number } | null) => void
}

export function SearchBar({ initialQ = "", initialLieuLabel, onSubmit, onLieuChange }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQ)
  const [lieuInput, setLieuInput] = useState(initialLieuLabel ?? "")
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)

  const debouncedInput = useThrottle(inputValue, 300)
  const debouncedLieu = useThrottle(lieuInput, 300)

  // Suggestions pour le champ métier
  const { data: suggestionData } = useQuery({
    queryKey: ["/v1/search/suggestions", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search", { querystring: { q: debouncedInput, hitsPerPage: 5, page: 0, radius: 30 } }, { signal }),
    enabled: debouncedInput.length >= 2,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions = Array.from(new Set((suggestionData?.hits ?? []).map((h) => h.title))).slice(0, 5)

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
    (value: string) => {
      onSubmit(value)
    },
    [onSubmit]
  )

  return (
    <Box
      sx={{
        display: "flex",
        gap: fr.spacing("2v"),
        alignItems: "flex-end",
        background: fr.colors.decisions.background.default.grey.default,
        borderRadius: "4px",
        p: fr.spacing("2v"),
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Champ métier */}
      <Box sx={{ flex: 2 }}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={inputValue}
          onInputChange={(_e, value) => {
            setInputValue(value)
            if (value === "") handleSubmit("")
          }}
          onChange={(_e, value) => {
            if (typeof value === "string" && value) {
              handleSubmit(value)
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Rechercher un métier, une compétence..."
              variant="outlined"
              size="small"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(inputValue)
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
      <Box sx={{ flex: 1 }}>
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

      <Button priority="primary" onClick={() => handleSubmit(inputValue)} iconId="fr-icon-search-line" iconPosition="right">
        Rechercher
      </Button>
    </Box>
  )
}
