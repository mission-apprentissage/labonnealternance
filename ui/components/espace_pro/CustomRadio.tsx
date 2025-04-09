import { Radio, RadioGroup, RadioGroupProps } from "@chakra-ui/react"
import { Box } from "@mui/material"

export const CustomRadio = ({
  name,
  onChange,
  value,
  possibleValues,
  radioProps,
  dataTestId,
}: {
  name: string
  onChange: (newValue: string) => void
  value?: string
  possibleValues: string[]
  radioProps?: Partial<RadioGroupProps>
  dataTestId?: string
}) => {
  return (
    <RadioGroup data-testid={dataTestId} variant="outline" size="md" {...radioProps} name={name} mr={3} onChange={onChange} value={value}>
      {possibleValues.map((value) => (
        <Radio key={value} value={value}>
          <Box component="span">{value}</Box>
        </Radio>
      ))}
    </RadioGroup>
  )
}
