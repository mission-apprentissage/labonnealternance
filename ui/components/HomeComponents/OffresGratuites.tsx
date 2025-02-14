import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

export default function OffresGratuites() {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }} gap={4} mb={{ base: 4, md: 0 }}>
      <GridItem order={{ base: 2, md: 1 }} colSpan={{ base: 1, md: 5 }}>
        <Text as="h2" variant="homeEditorialH2">
          Vos offres sont diffusées gratuitement au plus près des candidats
        </Text>
        <Text fontSize="18px" mt={4}>
          Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
          <DsfrLink aria-label="Accès au site un jeune une solution - nouvelle fenêtre" href="https://www.1jeune1solution.gouv.fr">
            1jeune1solution
          </DsfrLink>
          ,{" "}
          <DsfrLink aria-label="Accès au site Parcoursup - nouvelle fenêtre" href="https://www.parcoursup.fr">
            Parcoursup
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink aria-label="Accès au site Choisir son affectation après la 3è - nouvelle fenêtre" href="https://affectation3e.phm.education.gouv.fr/pna-public/">
            Choisir son affectation après la 3è
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink aria-label="Accès au site Mon master - nouvelle fenêtre" href="https://www.monmaster.gouv.fr/">
            Mon master
          </DsfrLink>{" "}
          ,{" "}
          <DsfrLink
            aria-label="Liste des partenaires diffuseurs des offres - nouvelle fenêtre"
            href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"
          >
            et bien d’autres
          </DsfrLink>
          .
        </Text>
      </GridItem>
      <GridItem order={{ base: 1, md: 2 }} colSpan={{ base: 1, md: 7 }}>
        <Box display="flex" alignItems="flex-start" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
          <Image src="/images/home_pics/illu-plateformesjeunes.svg" alt="" aria-hidden={true}></Image>
        </Box>
      </GridItem>
    </Grid>
  )
}
