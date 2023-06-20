import React from "react"
import ConnectionActions from "./ConnectionActions"
import { Box, Grid, GridItem, Image, Show, Text } from "@chakra-ui/react"

const CFA = () => {
  return (
    <Box mt="8">
      <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
        <GridItem colSpan={{ base: 1, md: 6 }}>
          <Text as="h1" variant="homeEditorialH1" mb={3}>
            Vous êtes un organisme de formation
          </Text>
          <Text as="h2" variant="homeEditorialH2">
            Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois
          </Text>
          <Box my="6">Créez le compte de votre CFA pour diffuser les offres de vos entreprises partenaires, et recevoir les candidatures.</Box>
          <ConnectionActions service="cfa" />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 6 }}>
          <Show above="md">
            <Image src="/images/home_pics/illu-entreprisesmandatees.svg" alt=""></Image>
          </Show>
        </GridItem>
      </Grid>
    </Box>
  )
}

export default CFA
