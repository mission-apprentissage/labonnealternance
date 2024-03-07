import { Box, Image, Text, Grid, GridItem, Link } from "@chakra-ui/react"
import React from "react"

const FacilitezRDVA = () => {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }} gap={4}>
      <GridItem colSpan={{ base: 1, md: 5 }}>
        <Text as="h2" variant="homeEditorialH2">
          Répondez facilement aux candidats intéressés par vos formations
        </Text>
        <Text fontSize="18px" mt={4}>
          Vous recevez directement dans votre boite mail des demandes de candidats intéressés par vos formations et pouvez leur répondre en quelques clics.
        </Text>
        <Text fontSize="14px" mt={6}>
          *Vous pouvez à tout moment vous désinscrire de ce service en contactant notre équipe.
          <Link href="/faq" variant="homeEditorialLink" aria-label="Lien vers la Foire aux questions"></Link>
        </Text>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 7 }}>
        <Box display="flex" alignItems="flex-start" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
          <Image src="/images/home_pics/facilitezRDVA.svg" alt="" aria-hidden={true}></Image>
        </Box>
      </GridItem>
    </Grid>
  )
}

export default FacilitezRDVA
