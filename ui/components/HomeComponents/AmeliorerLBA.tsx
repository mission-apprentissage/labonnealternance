import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Grid, GridItem, Image, Link, Text } from "@chakra-ui/react"
import React from "react"

const AmeliorerLBA = () => {
  return (
    <Box as="section" p="8" mb="12" backgroundColor="#f5f5fe" borderRadius="10px">
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }}>
        <GridItem display="flex" justifyContent="center" alignItems="center">
          <Image src="/images/home_pics/illu-support.svg" alt="" />
        </GridItem>
        <GridItem pl="8">
          <Text fontWeight="700" my="5">
            Donnez votre avis
          </Text>
          <Text as="h2" color="#000091" fontSize="2rem" fontWeight="500" my="5">
            Aidez-nous à améliorer La bonne alternance
          </Text>
          <Text>Vous êtes un jeune candidat à l’apprentissage ?</Text>
          <Text>Vous avez fait une recherche d’emploi ou de formation sur notre site ?</Text>
          <Text>
            <strong>Racontez-nous votre expérience !</strong>
          </Text>
          <Text>
            Nous vous invitions à participer à un échange vidéo avec un membre de notre équipe. Vous pourrez nous partager votre avis, et nous pourrons répondre à vos questions sur
            l’utilisation du service.
          </Text>
          <Box mt="7">
            <Link
              href="https://app.livestorm.co/p/801f855c-f452-4817-881a-c76f1fd899d7/form"
              aria-label=S'inscrire au webinaire - nouvelle fenêtre"
              title="M'inscrire au webinaire"
              color="#000091"
              border="1px solid #000091"
              padding="10px 24px"
              isExternal
            >
              M'inscrire au webinaire <ExternalLinkIcon mx="2px" />
            </Link>
          </Box>
          <Box mt="3">&nbsp;</Box>
        </GridItem>
      </Grid>
    </Box>
  )
}
export default AmeliorerLBA
