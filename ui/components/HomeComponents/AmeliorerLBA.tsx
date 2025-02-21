import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react"
import React from "react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

const AmeliorerLBA = () => {
  return (
    <Box as="section" p="8" mb="12" backgroundColor="#f5f5fe" borderRadius="10px">
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }}>
        <GridItem display="flex" justifyContent="center" alignItems="center">
          <Image src="/images/home_pics/illu-support.svg" alt="" />
        </GridItem>
        <GridItem pl="8">
          <Text as="h2" color="#000091" fontSize="2rem" fontWeight="500" my="5">
            Vous êtes une entreprise à la recherche d’alternants ?
          </Text>
          <Text>
            Participez à une démonstration de La bonne alternance. Un <strong>service public gratuit pour publier facilement vos offres sur plusieurs plateformes</strong> : La
            bonne alternance, 1jeune1solution, Parcoursup, l'Onisep, et bien d'autres.
          </Text>
          <Text>
            <strong>Chaque semaine</strong>, nous organisons des webinaires spécialement conçus pour les recruteurs afin de vous présenter toutes les fonctionnalités de notre
            plateforme.
          </Text>
          <Text>
            <strong>Profitez-en pour poser vos questions en direct !</strong>
          </Text>
          <Box mt="7">
            <DsfrLink
              href="https://app.livestorm.co/la-bonne-alternance/premiers-pas-sur-la-bonne-alternance-maximisez-votre-experience"
              aria-label="M'inscrire au webinaire - nouvelle fenêtre"
            >
              M'inscrire au webinaire
            </DsfrLink>
          </Box>
          <Box mt="3">&nbsp;</Box>
        </GridItem>
      </Grid>
    </Box>
  )
}
export default AmeliorerLBA
