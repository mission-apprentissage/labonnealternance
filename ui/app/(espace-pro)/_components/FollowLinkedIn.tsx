import { Grid, GridItem, Text } from "@chakra-ui/react"

import { DsfrLink } from "../../../components/dsfr/DsfrLink"

export const FollowLinkedIn = () => (
  <Grid px={{ base: 3, md: 6, lg: 12 }} as="section" py={6} bg="bluefrance.250" mb="24" templateColumns={{ base: "1fr", lg: "repeat(12, 1fr)" }} borderRadius={10}>
    <GridItem colSpan={{ base: 1, lg: 9 }} ml={{ base: 2, lg: 6 }}>
      <Text as="p" size="16px" fontWeight={700}>
        La mission ministérielle pour l’apprentissage construit des services numériques qui facilitent les entrées en apprentissage.
      </Text>
      <Text fontWeight={700} color="bluefrance.500" fontSize={{ base: 28, md: 30, lg: 32 }} pt={2}>
        Rendez-vous sur LinkedIn pour suivre nos actualités
      </Text>
    </GridItem>
    <GridItem mt="4" colSpan={{ base: 1, lg: 3 }} display="flex" justifyContent="center" alignItems="center">
      <DsfrLink
        href="https://www.linkedin.com/company/mission-apprentissage/posts/?feedView=all"
        aria-label="Accès à la page Linkedin de la mission ministérielle pour l’apprentissage - nouvelle fenêtre"
      >
        Voir notre page
      </DsfrLink>
    </GridItem>
  </Grid>
)
