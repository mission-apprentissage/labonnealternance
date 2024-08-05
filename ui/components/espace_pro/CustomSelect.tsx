import { Select, SelectProps } from "@chakra-ui/react"

export const CustomSelect = ({
  name,
  onChange,
  value,
  possibleValues,
  selectProps,
  dataTestId,
}: {
  name: string
  onChange: (newValue: string) => void
  value?: string
  possibleValues: string[]
  selectProps?: SelectProps
  dataTestId?: string
}) => {
  return (
    <Select data-testid={dataTestId} variant="outline" size="md" {...selectProps} name={name} mr={3} onChange={(e) => onChange?.(e.target.value)} value={value}>
      <option hidden>Sélectionnez une valeur...</option>
      {possibleValues.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </Select>
  )
}
