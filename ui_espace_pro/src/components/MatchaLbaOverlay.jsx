import { Box, Button, Container, Flex, Heading, Link, Text, useBoolean } from "@chakra-ui/react"
import { Close } from "../theme/components/icons"

export default () => {
  const [overlay, setOverlay] = useBoolean(true)

  return (
    <Box bg="black" sx={{ position: "fixed", bottom: 0 }} w="100%" display={overlay ? "block" : "none"}>
      <Container maxW="container.xl" py={3}>
        <Flex justify="flex-end" pr={4}>
          <Button display="flex" onClick={setOverlay.off} fontWeight="normal" variant="pill" color="#8585F6" rightIcon={<Close width={3} />}>
            fermer
          </Button>
        </Flex>
        <Container maxW="container.lg" pt={2} pb={5}>
          <Flex align="center" justify="space-between" direction={["column", "column", "column", "row"]}>
            <Box maxW="721px" mx={[0, 0, 0, 0 - 10]}>
              <Heading color="white" fontSize="24px">
                Matcha évolue et rejoint La Bonne Alternance.
              </Heading>
              <Text color="#cecece" maxW="666px" mt={4}>
                Matcha et La Bonne Alternance fusionnent afin de proposer un service complet aux jeunes, aux entreprises et aux organismes de formation. Des modifications
                successives surviendront sur le site internet Matcha dans les prochains mois.
              </Text>
            </Box>
            <Button as={Link} bg="#8585F6" borderRadius="0px" mt={[5, 5, 5, 5, 0]} href="https://labonnealternance.apprentissage.beta.gouv.fr/" isExternal>
              Accéder au site La Bonne Alternance
            </Button>
          </Flex>
        </Container>
      </Container>
    </Box>
  )
}
