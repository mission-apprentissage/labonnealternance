import { Box, Flex, Spinner, Text } from "@chakra-ui/react"

export default function LoadingEmptySpace({ label = "" }) {
  return (
    <>
      <Box>
        <Flex justify="center" align="center" h="100vh" direction="column">
          <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
          <Text>{label}</Text>
        </Flex>
      </Box>
    </>
  )
}
