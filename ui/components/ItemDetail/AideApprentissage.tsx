import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Link, Text } from "@chakra-ui/react"

const AideApprentissage = () => {
  return (
    <Box pb="0px" mt={6} mb={4} position="relative" background="white" padding="16px 24px" mx={["0", "30px"]}>
      <Text as="h2" variant="itemDetailH2" mt={2}>
        Avez-vous droit à des aides financières ?
      </Text>

      <Box color="grey.700" mt={6}>
        Grâce à 1jeune1solution, évaluez vos droits à près de 1000 aides financières en moins de 5 min.
      </Box>

      <Box color="grey.700" mt={6}>
        Accéder à{" "}
        <Link
          variant="basicUnderlined"
          href="https://www.1jeune1solution.gouv.fr/mes-aides"
          aria-label="Accès à l'outil de simulation de 1jeune1solution - nouvelle fenêtre"
          isExternal
        >
          l’outil de simulation 1jeune1solution <ExternalLinkIcon mx="2px" />
        </Link>
      </Box>
    </Box>
  )
}

export default AideApprentissage
