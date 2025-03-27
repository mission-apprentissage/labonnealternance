import { Box, Container, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

type Target = "candidat" | "cfa" | "recruteur"

const textes: Record<Target, string> = {
  cfa: "La bonne alternance recense une liste d’outils et de liens utiles pour les organismes de formation qui accompagnent des jeunes dans leurs recherches de contrat.",
  recruteur: "La bonne alternance recense une liste d’outils et de liens utiles pour les recruteurs afin de vous aider dans vos démarches de recrutement en alternance.",
  candidat: "La bonne alternance recense une liste d’outils et de liens utiles pour vous aider dans vos démarches de recherche d’alternance.",
}

export const PromoRessources = ({ target }: { target: Target }) => (
  <Container textAlign="center" variant="responsiveContainer">
    <Image margin="auto" src="/images/pages_ressources/outils.svg" aria-hidden={true} alt="" />
    <Text fontSize={24} fontWeight={700}>
      {textes[target]}
    </Text>
    <Box mt="7">
      <DsfrLink href={`${PAGES.static.ressources.getPath()}#${target}`}>Découvrir les ressources</DsfrLink>
    </Box>
  </Container>
)
