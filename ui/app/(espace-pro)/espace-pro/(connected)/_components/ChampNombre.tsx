import { Button, Flex, Stack, Text } from "@chakra-ui/react"

import { Minus, Plus } from "@/theme/components/icons"

export const ChampNombre = ({ value, max, name, handleChange, label, dataTestId }) => {
  return (
    <Flex align="center" data-testid={dataTestId} gap={6}>
      <Text flexGrow={2}>{label}</Text>
      <Stack direction="row" align="center">
        <Button onClick={() => handleChange(name, value - 1)} isDisabled={value === 1} variant="secondary" data-testid="-">
          <Minus />
        </Button>
        <Text minW="24px" textAlign="center" data-testid={`${dataTestId}-value`}>
          {value}
        </Text>
        <Button onClick={() => handleChange(name, value + 1)} isDisabled={value === max} variant="secondary" data-testid="+">
          <Plus />
        </Button>
      </Stack>
    </Flex>
  )
}
