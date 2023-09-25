import { Box, Image, Link, Text } from "@chakra-ui/react"
import React from "react"

const AideApprentissage = ({ item }) => {
  const kind = item?.ideaType

  return (
    <Box pb="0px" mt={6} mb={4} position="relative" background="white" padding="16px 24px" mx={["0", "30px"]}>
      <Text as="h2" variant="itemDetailH2" mt={2}>
        {kind === "formation" ? "Ai-je le droit à une aide ?" : "Simuler mes droits aux aides"}
      </Text>

      <Box color="grey.700" mt={6}>
        Grâce à 1jeune1solution, évaluez vos droits à près de 1000 aides financières en moins de 5 min.
      </Box>

      <Box color="grey.700" mt={6}>
        Accéder à{" "}
        <Link href="https://mes-aides.1jeune1solution.beta.gouv.fr/" aria-label="Accès à l'outil de simulation de 1jeune1solution" textDecor="underline" isExternal>
          l’outil de simulation 1jeune1solution
          <Image src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" display="inline-block" pl="1" />
        </Link>
      </Box>
    </Box>
  )
}

export default AideApprentissage
