import { FormControlLabel, Radio, RadioGroup } from "@mui/material"
import type { BaseSyntheticEvent } from "react"

export const CustomRadio = ({
  name,
  onChange,
  value,
  possibleValues,
  radioProps = {},
  dataTestId,
  size = "medium",
}: {
  name: string
  onChange: (e: BaseSyntheticEvent, newValue: string) => void
  value?: string
  possibleValues: string[]
  radioProps?: any
  dataTestId?: string
  size?: "small" | "medium"
}) => {
  return (
    <RadioGroup data-testid={dataTestId} onChange={onChange} sx={radioProps} name={name} value={value}>
      {possibleValues.map((value) => (
        <FormControlLabel key={value} control={<Radio size={size} />} value={value} label={value}></FormControlLabel>
      ))}
    </RadioGroup>
  )
}
