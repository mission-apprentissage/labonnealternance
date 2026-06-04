"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Checkbox, FormControl, InputLabel, ListItemText, ListSubheader, MenuItem, OutlinedInput, Select } from "@mui/material"

/**
 * Multi-select de filtre pour `/search/split`, basé sur le `Select multiple`
 * MUI (rendu pilule + label flottant, proche de la maquette). Ajoute le
 * support des sous-groupes (`groups`), des compteurs par option et le tri
 * alphabétique. Application immédiate à chaque coche (pas de confirmation).
 */
export type MultiSelectOption = {
  value: string
  label: string
  count?: number
}

export type MultiSelectGroup = {
  label: string
  options: MultiSelectOption[]
}

function sortAlpha(options: MultiSelectOption[]): MultiSelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, "fr"))
}

function Count({ count }: { count?: number }) {
  if (count == null) return null
  return (
    <Box
      component="span"
      sx={{ ml: fr.spacing("3v"), flexShrink: 0, color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums" }}
    >
      {count}
    </Box>
  )
}

export function SearchMultiSelectField({
  id,
  label,
  topLabel,
  options,
  groups,
  value,
  onChange,
}: {
  id: string
  label: string
  /** Si fourni, affiche un libellé au-dessus de la pilule (variante « une ligne ») au lieu du label flottant. */
  topLabel?: string
  options?: MultiSelectOption[]
  groups?: MultiSelectGroup[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  // Sous-groupes triés alpha, ou liste plate triée alpha repliée en un seul groupe.
  const renderGroups: MultiSelectGroup[] = groups ? groups.map((g) => ({ label: g.label, options: sortAlpha(g.options) })) : [{ label: "", options: sortAlpha(options ?? []) }]

  const hasOptions = renderGroups.some((g) => g.options.length > 0)
  if (!hasOptions && value.length === 0) return null

  return (
    <FormControl size="small" sx={{ flexShrink: 0, ...(topLabel ? {} : { width: 170 }) }}>
      {topLabel ? (
        <Box
          component="label"
          htmlFor={id}
          sx={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}
        >
          {topLabel}
        </Box>
      ) : (
        <InputLabel id={`${id}-label`} sx={{ fontSize: "0.875rem" }}>
          {label}
        </InputLabel>
      )}
      <Select
        labelId={topLabel ? undefined : `${id}-label`}
        id={id}
        multiple
        displayEmpty={Boolean(topLabel)}
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          onChange(typeof raw === "string" ? raw.split(",") : raw)
        }}
        input={topLabel ? <OutlinedInput /> : <OutlinedInput label={label} />}
        // Toujours « Label (N) » (jamais la valeur) → texte court et largeur constante.
        // En mode topLabel, l'état vide affiche le label court comme placeholder dans la pilule.
        renderValue={(selected) =>
          selected.length === 0 ? (
            topLabel ? (
              <Box component="span" sx={{ fontSize: "0.875rem", lineHeight: 1.4, color: fr.colors.decisions.text.mention.grey.default }}>
                {label}
              </Box>
            ) : null
          ) : (
            <Box component="span" sx={{ fontSize: "0.875rem", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {`${label} (${selected.length})`}
            </Box>
          )
        }
        MenuProps={{ PaperProps: { sx: { maxHeight: 360, minWidth: 280 } } }}
        sx={{ height: 40, width: topLabel ? 170 : undefined, ".MuiSelect-select": { display: "flex", alignItems: "center", py: "8px" } }}
      >
        {renderGroups.flatMap((group) => {
          const items = group.options.map((option) => (
            <MenuItem key={option.value} value={option.value} dense sx={{ pl: group.label ? fr.spacing("2v") : undefined }}>
              <Checkbox checked={value.includes(option.value)} size="small" sx={{ py: 0 }} />
              <ListItemText primary={option.label} primaryTypographyProps={{ fontSize: "0.875rem" }} />
              <Count count={option.count} />
            </MenuItem>
          ))
          if (!group.label) return items
          return [
            <ListSubheader
              key={`__sub-${group.label}`}
              disableSticky
              sx={{
                lineHeight: 2.2,
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: fr.colors.decisions.text.mention.grey.default,
                backgroundColor: "inherit",
              }}
            >
              {group.label}
            </ListSubheader>,
            ...items,
          ]
        })}
      </Select>
    </FormControl>
  )
}
