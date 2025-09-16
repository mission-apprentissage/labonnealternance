import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormLabel, Input, Select, MenuItem, ListItemText, Checkbox, SelectChangeEvent } from "@mui/material"
import { useRefinementList, UseRefinementListProps } from "react-instantsearch"

interface CustomRefinementListProps extends UseRefinementListProps {
  title?: string
  placeholder?: string
}

export function CustomRefinementList({ title, placeholder, attribute, ...props }: CustomRefinementListProps) {
  const { items, refine } = useRefinementList({ attribute, ...props })

  if (items.length === 0) return null

  const selectedValues = items.filter((item) => item.isRefined).map((item) => item.value)

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event
    const newValues = typeof value === "string" ? value.split(",") : value

    // Refine items that were selected but are now deselected
    items.forEach((item) => {
      const wasSelected = selectedValues.includes(item.value)
      const isSelected = newValues.includes(item.value)

      if (wasSelected !== isSelected) {
        refine(item.value)
      }
    })
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth>
        {title && <FormLabel>{title}</FormLabel>}
        <Select
          multiple
          value={selectedValues}
          onChange={handleChange}
          displayEmpty
          renderValue={(selected) => {
            if (selected.length === 0) {
              return placeholder || "Sélectionner..."
            }
            const selectedItems = items.filter((item) => selected.includes(item.value))
            return selectedItems.map((item) => `${item.label} (${item.count})`).join(", ")
          }}
          input={<Input className={fr.cx("fr-input")} />}
        >
          {items.map((item) => {
            const isChecked = selectedValues.includes(item.value)
            return (
              <MenuItem key={item.value} value={item.value}>
                <Checkbox checked={isChecked} />
                <ListItemText primary={`${item.label} (${item.count})`} />
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </Box>
  )
}
