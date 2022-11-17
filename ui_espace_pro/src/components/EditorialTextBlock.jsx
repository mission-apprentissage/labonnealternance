import { Stack, Heading, Box, Text } from "@chakra-ui/react"

export default ({ content, header }) => {
  return (
    <Stack direction="column" spacing="32px" border="1px solid #E5E5E5" borderBottom="4px solid #000091" p="32px">
      <Heading fontSize="22px" fontWeight="700" color="bluefrance.500">
        {header}
      </Heading>
      {content.map((c) => {
        return (
          <Box key={c.title}>
            <Text fontWeight="700" pb={2}>
              {c.title}
            </Text>
            <Text>{c.description}</Text>
          </Box>
        )
      })}
    </Stack>
  )
}
