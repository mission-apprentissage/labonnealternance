"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, MenuItem, Select } from "@mui/material"

import type { SearchMode } from "../_utils/search.params.utils"

/**
 * Options riches (titre + hint) du champ « Type de recherche ». Un select natif DSFR
 * ne rend pas les hints → MUI Select stylé DSFR. En mobile, préférer des radios DSFR.
 */
export const SEARCH_MODE_OPTIONS: { value: SearchMode; label: string; hint: string }[] = [
  { value: "emplois", label: "Emplois uniquement", hint: "Les entreprises qui recrutent en alternance" },
  { value: "formations", label: "Formations uniquement", hint: "Les formations en alternance proposées par les écoles" },
  { value: "emplois_formation", label: "Emplois avec formation incluse", hint: "L'offre d'emploi est associée à une formation" },
]

export function SearchTypeRechercheSelect({ value, onChange, fullWidth = false }: { value: SearchMode; onChange: (mode: SearchMode) => void; fullWidth?: boolean }) {
  return (
    <Box sx={{ width: fullWidth ? "100%" : 232, flexShrink: 0 }}>
      <Box
        component="label"
        id="search-mode-label"
        sx={{ display: "block", fontWeight: 700, fontSize: "1rem", mb: fr.spacing("1v"), color: fr.colors.decisions.text.default.grey.default }}
      >
        Type de recherche
      </Box>
      <Select
        labelId="search-mode-label"
        id="search-mode"
        value={value}
        onChange={(e) => onChange(e.target.value as SearchMode)}
        renderValue={(selected) => SEARCH_MODE_OPTIONS.find((o) => o.value === selected)?.label}
        fullWidth
        MenuProps={{
          PaperProps: {
            elevation: 0,
            sx: { mt: "4px", borderRadius: "4px", py: "8px", width: 282, boxShadow: "0 6px 18px rgba(0,0,18,0.16)" },
          },
        }}
        sx={{
          height: 48,
          borderRadius: "4px",
          backgroundColor: "#FFFFFF",
          fontSize: "1rem",
          color: fr.colors.decisions.text.default.grey.default,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: fr.colors.decisions.border.default.grey.default, borderWidth: 1 },
        }}
      >
        {SEARCH_MODE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              display: "block",
              whiteSpace: "normal",
              px: "16px",
              py: "10px",
              "&.Mui-selected": { backgroundColor: fr.colors.decisions.background.contrast.blueFrance.default },
            }}
          >
            <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>{option.label}</Box>
            <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>{option.hint}</Box>
          </MenuItem>
        ))}
      </Select>
    </Box>
  )
}
