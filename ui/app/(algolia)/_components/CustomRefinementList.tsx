import { fr } from "@codegouvfr/react-dsfr"
import { Box, FormControl, FormLabel, Input, Select, MenuItem, ListItemText, Checkbox, SelectChangeEvent } from "@mui/material"
import { useRefinementList, UseRefinementListProps } from "react-instantsearch"

interface CustomRefinementListProps extends UseRefinementListProps {
  title?: string
  placeholder?: string
}

export function CustomRefinementList({ title, placeholder, attribute, ...props }: CustomRefinementListProps) {
  const { items, refine } = useRefinementList({ attribute, ...props, showMore: true, showMoreLimit: 1000 })

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
            if (selected.length === 1) {
              const selectedItem = items.find((item) => selected.includes(item.value))
              return selectedItem ? `${selectedItem.label} (${selectedItem.count})` : ""
            }
            return `${selected.length} éléments sélectionnés`
          }}
          input={<Input className={fr.cx("fr-input")} />}
        >
          {items.map((item) => {
            const isChecked = selectedValues.includes(item.value)
            const isDisabled = item.count === 0 && !isChecked
            return (
              <MenuItem key={item.value} value={item.value} disabled={isDisabled}>
                <Checkbox checked={isChecked} disabled={isDisabled} />
                <ListItemText
                  primary={`${item.label} (${item.count})`}
                  sx={{
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                />
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </Box>
  )
}
