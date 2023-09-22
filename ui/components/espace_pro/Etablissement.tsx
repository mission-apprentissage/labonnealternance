import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"

export default function Etablissement({ title, subtitle, description, buttonLabel, bg, link, type }) {
  const router = useRouter()

  return (
    <Box p={5} px={7} bg={bg} border="3px solid transparent" _hover={{ background: "white", border: "3px solid #000091" }} flex="1">
      <Stack direction="column" spacing="20px" py={10}>
        <Heading color="bluefrance.500" fontSize="32px">
          {title}
        </Heading>
        <Text fontWeight="700" fontSize="28px">
          {subtitle}
        </Text>
        <Text>{description}</Text>
        <Button
          size="lg"
          variant="primary"
          onClick={() => {
            router.push({
              pathname: `${link}`,
              query: { type },
            })
          }}
        >
          {buttonLabel}
        </Button>
      </Stack>
    </Box>
  )
}
