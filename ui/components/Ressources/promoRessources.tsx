import { Box, Container, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

const getText = (target: string) => {
  switch (target) {
    case "cfa": {
      return "La bonne alternance recense une liste d’outils et de liens utiles pour les organismes de formation qui accompagnent des jeunes dans leurs recherches de contrat."
    }
    case "recruteur": {
      return "La bonne alternance recense une liste d’outils et de liens utiles pour les recruteurs afin de vous aider dans vos démarches de recrutement en alternance."
    }
    default: {
      return "La bonne alternance recense une liste d’outils et de liens utiles pour vous aider dans vos démarches de recherche d’alternance."
    }
  }
}

export default function PromoRessources({ target }) {
  return (
    <Container textAlign="center" variant="responsiveContainer">
      <Image margin="auto" src="/images/pages_ressources/outils.svg" aria-hidden={true} alt="" />
      <Text fontSize={24} fontWeight={700}>
        {getText(target)}
      </Text>
      <Box mt="7">
        <DsfrLink href={`/ressources#${target}`}>Découvrir les ressources</DsfrLink>
      </Box>
    </Container>
  )
}
