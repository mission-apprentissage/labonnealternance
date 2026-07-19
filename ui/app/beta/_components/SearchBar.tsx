"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
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

// Champs du design « Nouvelle recherche » : blancs, 48px, stroke 1px, radius 4 — plus de fond
// gris contrasté ni de bordure basse ni d'icône dans le champ.
const fieldSx = (error?: boolean) => ({
  ".MuiInputBase-input": { fontSize: "1rem" },
  ".MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
  },
  ".MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${error ? fr.colors.decisions.border.plain.error.default : fr.colors.decisions.border.default.grey.default}`,
  },
  ".MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${error ? fr.colors.decisions.border.plain.error.default : fr.colors.decisions.border.default.grey.default}`,
  },
  ".MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "2px solid #0a76f6",
  },
})

// Panneau flottant des autocompletes (ombre + radius du design).
const POPPER_PAPER_SX = { mt: "4px", borderRadius: "4px", py: "8px", boxShadow: "0 6px 18px rgba(0,0,18,0.16)" }

/**
 * Sous-chaîne matchée en gras dans les suggestions ("La **Coiff**erie"), insensible à la
 * casse et aux accents. Le mapping des index reste 1:1 : chaque code point est normalisé
 * individuellement (on ne garde que le caractère de base).
 */
export function highlightMatch(label: string, input: string): ReactNode {
  const query = input.trim()
  if (!query) return label
  const normalizeChar = (c: string) => c.normalize("NFD")[0].toLowerCase()
  const labelChars = [...label]
  const normalized = labelChars.map(normalizeChar).join("")
  const needle = [...query].map(normalizeChar).join("")
  const start = normalized.indexOf(needle)
  if (start < 0) return label
  const end = start + [...query].length
  return (
    <>
      {labelChars.slice(0, start).join("")}
      <Box component="span" sx={{ fontWeight: 700 }}>
        {labelChars.slice(start, end).join("")}
      </Box>
      {labelChars.slice(end).join("")}
    </>
  )
}

type LieuOption = { label: string; latitude: number; longitude: number }

// Option du dropdown métier : la 1ʳᵉ ligne relance la recherche en texte libre, les
// suivantes sont les suggestions de l'endpoint suggest.
type MetierOption = { kind: "free_text"; value: string } | { kind: "suggestion"; value: string }

interface SearchBarProps {
  initialQ?: string
  initialLieuLabel?: string
  /** source : "suggestion" si l'utilisateur a sélectionné une option d'autocomplete, "free_text" sinon (télémétrie moteur de suggestion). */
  onSubmit: (q: string, source: "suggestion" | "free_text") => void
  onLieuChange: (lieu: { label: string; latitude: number; longitude: number } | null) => void
  /** Saisie courante du champ métier (formulaire home : le bouton Rechercher lit la valeur non validée). */
  onQChange?: (q: string) => void
  /** "row" : barre desktop ; "column" : panneau mobile ; "responsive" : colonne en xs, rangée en md+ (home). */
  layout?: "row" | "column" | "responsive"
  /** Message d'erreur DSFR sous le champ métier (label + stroke passent en rouge). */
  qError?: string
  /** Message d'erreur DSFR sous le champ lieu. */
  lieuError?: string
}

function FieldLabel({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <Box
      component="label"
      sx={{
        display: "block",
        fontSize: "1rem",
        fontWeight: 700,
        color: error ? fr.colors.decisions.text.default.error.default : fr.colors.decisions.text.default.grey.default,
        mb: fr.spacing("1v"),
      }}
    >
      {children}
    </Box>
  )
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v"), mt: fr.spacing("1v"), fontSize: "0.75rem", color: fr.colors.decisions.text.default.error.default }}>
      <Box component="span" className={fr.cx("fr-icon-error-fill", "fr-icon--sm")} aria-hidden="true" />
      {children}
    </Box>
  )
}

export function SearchBar({ initialQ = "", initialLieuLabel, onSubmit, onLieuChange, onQChange, layout = "row", qError, lieuError }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQ)
  const [lieuInput, setLieuInput] = useState(initialLieuLabel ?? "")
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)
  // Libellé du lieu réellement APPLIQUÉ à la recherche — source de vérité pour la
  // restauration au blur (le champ ne doit jamais afficher un texte ≠ critère actif).
  const [appliedLieuLabel, setAppliedLieuLabel] = useState(initialLieuLabel ?? "")

  const debouncedInput = useThrottle(inputValue, 300)
  const debouncedLieu = useThrottle(lieuInput, 300)

  const isColumn = layout === "column"
  // Valeurs sx par layout : "responsive" = colonne en xs, rangée en md+ (formulaire home).
  const responsive = layout === "responsive"
  const rowSx = {
    direction: isColumn ? "column" : responsive ? { xs: "column", md: "row" } : "row",
    gap: isColumn ? fr.spacing("4v") : responsive ? { xs: fr.spacing("4v"), md: fr.spacing("3v") } : fr.spacing("3v"),
    align: isColumn ? "stretch" : responsive ? { xs: "stretch", md: "flex-end" } : "flex-end",
    metierFlex: isColumn ? "none" : responsive ? { xs: "none", md: 2 } : 2,
    lieuFlex: isColumn ? "none" : responsive ? { xs: "none", md: "0 0 320px" } : "0 0 320px",
    fieldWidth: isColumn ? "100%" : responsive ? { xs: "100%", md: "auto" } : undefined,
  } as const

  // Suggestions pour le champ métier — autocomplétion par préfixe (endpoint dédié, min 3 caractères)
  const { data: suggestionData } = useQuery({
    queryKey: ["/v1/search/suggest", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search/suggest", { querystring: { q: debouncedInput, limit: 8 } }, { signal }),
    enabled: debouncedInput.length >= 3,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions = suggestionData?.suggestions ?? []

  // Options du dropdown : ligne d'action « Rechercher : {saisie} » + groupe Suggestions.
  const metierOptions: MetierOption[] = inputValue.trim()
    ? [{ kind: "free_text", value: inputValue }, ...suggestions.map((s): MetierOption => ({ kind: "suggestion", value: s }))]
    : []

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

  const normalizeLieu = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

  const selectLieu = (lieu: LieuOption) => {
    setLieuValue(lieu)
    setLieuInput(lieu.label)
    setAppliedLieuLabel(lieu.label)
    onLieuChange(lieu)
  }

  // Sortie du champ lieu sans sélection : le texte tapé n'est pas une valeur (pas de géo sans
  // sélection BAN). Tolérance : s'il correspond exactement à une suggestion, on la sélectionne ;
  // sinon on RESTAURE le libellé du lieu appliqué — jamais de texte fantôme (affiché ≠ appliqué).
  const handleLieuBlur = () => {
    if (lieuInput.trim() === appliedLieuLabel.trim()) return
    const exact = lieuSuggestions.find((option) => normalizeLieu(option.label) === normalizeLieu(lieuInput))
    if (exact) {
      selectLieu(exact)
      return
    }
    setLieuInput(appliedLieuLabel)
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: rowSx.direction,
        gap: rowSx.gap,
        alignItems: rowSx.align,
      }}
    >
      {/* Champ métier */}
      <Box sx={{ flex: rowSx.metierFlex, width: rowSx.fieldWidth }}>
        <FieldLabel error={Boolean(qError)}>Que recherchez-vous ?</FieldLabel>
        <Autocomplete
          freeSolo
          options={metierOptions}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.value)}
          inputValue={inputValue}
          onInputChange={(_e, value, reason) => {
            // "reset" est déclenché par la sélection d'une option — ne pas écraser la saisie
            // avec le libellé de la ligne « Rechercher : … ».
            if (reason === "reset") return
            setInputValue(value)
            onQChange?.(value)
            if (value === "") handleSubmit("", "free_text")
          }}
          onChange={(_e, value) => {
            if (!value) return
            if (typeof value === "string") {
              handleSubmit(value, "free_text")
              return
            }
            handleSubmit(value.value, value.kind === "suggestion" ? "suggestion" : "free_text")
          }}
          renderOption={(props, option) =>
            option.kind === "free_text" ? (
              <Box
                component="li"
                {...props}
                key="__free_text__"
                sx={{
                  minHeight: 60,
                  px: "16px !important",
                  display: "flex",
                  alignItems: "center",
                  gap: fr.spacing("2v"),
                  backgroundColor: `${fr.colors.decisions.background.contrast.blueFrance.default} !important`,
                }}
              >
                <Box component="span" className={fr.cx("fr-icon-search-line", "fr-icon--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default }} aria-hidden="true" />
                <Box>
                  <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>
                    Rechercher :{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {option.value}
                    </Box>
                  </Box>
                  <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>ou appuyer sur Entrée</Box>
                </Box>
              </Box>
            ) : (
              <Box
                component="li"
                {...props}
                key={option.value}
                sx={{ minHeight: 40, px: "16px !important", fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}
              >
                {/* Span unique : le li MUI est en display:flex — des fragments texte séparés y perdent leurs espaces de bord. */}
                <Box component="span">{highlightMatch(option.value, inputValue)}</Box>
              </Box>
            )
          }
          groupBy={(option) => (option.kind === "suggestion" ? "Suggestions" : "")}
          renderGroup={(params) => (
            <Box component="li" key={params.key}>
              {params.group && <Box sx={{ px: "16px", lineHeight: "36px", fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>{params.group}</Box>}
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none" }}>
                {params.children}
              </Box>
            </Box>
          )}
          slotProps={{ paper: { sx: POPPER_PAPER_SX } }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Recherche par mot clé (métier, formation, entreprise, compétence,...)"
              variant="outlined"
              size="small"
              fullWidth
              sx={fieldSx(Boolean(qError))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(inputValue, "free_text")
              }}
            />
          )}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
        {qError && <FieldError>{qError}</FieldError>}
      </Box>

      {/* Champ lieu */}
      <Box sx={{ flex: rowSx.lieuFlex, width: rowSx.fieldWidth }}>
        <FieldLabel error={Boolean(lieuError)}>Lieu</FieldLabel>
        <Autocomplete
          freeSolo
          // autoHighlight : la 1re suggestion est pré-surlignée → Entrée la sélectionne
          // (au lieu de laisser un texte non validé).
          autoHighlight
          options={lieuSuggestions}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
          isOptionEqualToValue={(o, v) => (typeof v === "string" ? o.label === v : o.label === v.label)}
          inputValue={lieuInput}
          value={lieuValue}
          onBlur={handleLieuBlur}
          onInputChange={(_e, value, reason) => {
            setLieuInput(value)
            // "clear" = clic sur la croix MUI — on retire le lieu des params
            // "reset" peut se déclencher à l'hydration, on l'ignore volontairement
            if (reason === "clear") {
              setLieuValue(null)
              setAppliedLieuLabel("")
              onLieuChange(null)
            }
          }}
          onChange={(_e, value) => {
            if (value && typeof value !== "string") {
              selectLieu(value)
            }
          }}
          renderOption={(props, option, { index }) => (
            <Box component="li" {...props} key={option.label} sx={{ minHeight: 40, px: "16px !important", display: "block !important" }}>
              <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>{highlightMatch(option.label, lieuInput)}</Box>
              {index === 0 && <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>ou appuyer sur Entrée</Box>}
            </Box>
          )}
          slotProps={{ paper: { sx: POPPER_PAPER_SX } }}
          renderInput={(params) => <TextField {...params} placeholder="France entière" variant="outlined" size="small" fullWidth sx={fieldSx(Boolean(lieuError))} />}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
        {lieuError && <FieldError>{lieuError}</FieldError>}
      </Box>
    </Box>
  )
}
