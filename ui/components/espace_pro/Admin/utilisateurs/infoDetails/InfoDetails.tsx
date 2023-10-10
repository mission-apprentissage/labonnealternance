import { Box, HStack, VStack } from "@chakra-ui/react"
import React from "react"

import { StyledInfoDetails } from "./infoDetails.styled"

interface Props<TData> {
  title?: string
  data: TData
  rows: {
    [key: string]: {
      header?: () => React.ReactNode
      cell?: (data: TData) => React.ReactNode
    }
  }
}
/**
 * A handy component to display a list of key/value pairs
 * largely inspired by @tanstack/react-table
 */
const InfoDetails = <TData,>({ title, rows, data }: Props<TData>) => {
  return (
    <StyledInfoDetails>
      {title && (
        <Box as="h2" fontSize="xl" fontWeight="semibold" mb={4}>
          {title}
        </Box>
      )}
      {Object.entries(rows).map(([key, { header, cell }]) => {
        const dataKey = key as keyof TData
        const value = data[dataKey]

        return (
          <VStack key={key} gap={6} alignItems="baseline">
            <HStack mb={4} alignItems="baseline">
              <Box w="300px">{header?.() ?? key} </Box>
              {/* @ts-ignore */}
              <div>{cell?.(data) ?? value}</div>
            </HStack>
          </VStack>
        )
      })}
    </StyledInfoDetails>
  )
}

export default InfoDetails
