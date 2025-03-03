import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react"

export function GerezEntreprise() {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }} gap={4} mb={10}>
      <GridItem colSpan={{ base: 1, md: 7 }}>
        <Box display="flex" alignItems="flex-start" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
          <Image src="/images/home_pics/illu-listeoffres.svg" aria-hidden={true} alt=""></Image>
        </Box>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 5 }}>
        <Text as="h2" variant="homeEditorialH2">
          Développez et gérez vos entreprises partenaires
        </Text>
        <Text fontSize="18px" mt={4}>
          3 étapes seulement pour mettre en ligne les besoins de vos entreprises partenaires. Vos offres regroupant formation et emploi seront mises en avant sur les différents
          sites.
        </Text>
        <Text fontSize="18px" mt={4}>
          Recevez dans votre boîte mail des demandes de contact d’entreprises en recherche d’alternants.
        </Text>
      </GridItem>
    </Grid>
  )
}
