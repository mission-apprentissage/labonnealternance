import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

const OffresAutoExposees = () => {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }} gap={4} mb={10}>
      <GridItem colSpan={{ base: 1, md: 7 }}>
        <Box display="flex" alignItems="flex-start" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
          <Image src="/images/home_pics/illu-offreformation.svg" aria-hidden={true} alt=""></Image>
        </Box>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 5 }}>
        <Text as="h2" variant="homeEditorialH2">
          Vos formations en alternance sont automatiquement exposées
        </Text>
        <Text fontSize="18px" mt={4}>
          Pour référencer et mettre à jour vos formations sur La bonne alternance, nul besoin de vous créer un compte, il vous suffit de les déclarer auprès du Carif-Oref de votre
          région.
          <br />
          <br />
          Elles sont ensuite nationalement agrégées par le Réseau des Carif-Oref puis automatiquement exposées sur La bonne alternance.{" "}
          <DsfrLink href={PAGES.static.faq.getPath() + "#cfa"} aria-label="Lien vers la FAQ des CFA">
            En savoir plus
          </DsfrLink>
        </Text>
      </GridItem>
    </Grid>
  )
}

export default OffresAutoExposees
