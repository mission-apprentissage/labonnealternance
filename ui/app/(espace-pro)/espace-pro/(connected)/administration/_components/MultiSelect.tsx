import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select } from "@mui/material"

export function MultiSelect<T extends string>({
  id,
  label,
  width,
  items,
  value,
  onChange,
  disabled = false,
}: {
  id: string
  label: string
  width: number
  items: { value: T; label: string }[]
  value: T[]
  onChange: (newValue: T[]) => void
  disabled?: boolean
}) {
  const allSelected = value.length === items.length
  const someSelected = value.length > 0 && !allSelected

  function handleChange(selected: string[]) {
    if (selected.includes("__all__")) {
      onChange(allSelected ? [] : items.map((i) => i.value))
    } else {
      onChange(selected as T[])
    }
  }

  const displayLabel = value.length === 0 ? "Tous" : value.map((v) => items.find((i) => i.value === v)?.label ?? v).join(", ")

  // Case décorative : l'option (role="option") porte déjà l'état via aria-selected, une case lue en plus serait sans nom (RGAA 11.1)
  return (
    <FormControl sx={{ width }} size="small" disabled={disabled}>
      <InputLabel id={`${id}-label`} sx={{ fontSize: ".875rem" }}>
        {label}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        multiple
        value={value}
        onChange={(e) => handleChange(e.target.value as string[])}
        input={<OutlinedInput label={label} />}
        renderValue={() => displayLabel}
        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
      >
        <MenuItem value="__all__" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Checkbox checked={allSelected} indeterminate={someSelected} size="small" tabIndex={-1} disableRipple slotProps={{ input: { "aria-hidden": true, tabIndex: -1 } }} />
          <ListItemText primary={allSelected ? "Tout désélectionner" : "Tout sélectionner"} slotProps={{ primary: { fontSize: ".875rem" } }} />
        </MenuItem>
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            <Checkbox checked={value.includes(item.value)} size="small" tabIndex={-1} disableRipple slotProps={{ input: { "aria-hidden": true, tabIndex: -1 } }} />
            <ListItemText primary={item.label} slotProps={{ primary: { fontSize: ".875rem" } }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
