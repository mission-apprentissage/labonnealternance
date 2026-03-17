"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
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

interface SearchBarProps {
  initialQ?: string
  onSubmit: (q: string) => void
}

export function SearchBar({ initialQ = "", onSubmit }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQ)
  const debouncedInput = useThrottle(inputValue, 300)

  const { data } = useQuery({
    queryKey: ["/v1/search/suggestions", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search", { querystring: { q: debouncedInput, hitsPerPage: 5, page: 0, radius: 30 } }, { signal }),
    enabled: debouncedInput.length >= 2,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })

  const suggestions = Array.from(new Set((data?.hits ?? []).map((h) => h.title))).slice(0, 5)

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
      <Box sx={{ flex: 1 }}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={inputValue}
          onInputChange={(_e, value) => setInputValue(value)}
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
                if (e.key === "Enter") {
                  handleSubmit(inputValue)
                }
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
      <Button priority="primary" onClick={() => handleSubmit(inputValue)} iconId="fr-icon-search-line" iconPosition="right">
        Rechercher
      </Button>
    </Box>
  )
}
