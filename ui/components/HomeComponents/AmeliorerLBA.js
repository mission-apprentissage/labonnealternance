import React from "react"
import { Box, Grid, GridItem, Link, Image, Text } from "@chakra-ui/react"

const AmeliorerLBA = () => {
  return (
    <Box as="section" p="8" mb="5" backgroundColor="#f5f5fe" borderRadius="10px">
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
          <Text>La bonne alternance est un service en construction. Pour le faire évoluer, nous interrogeons régulièrement les utilisateurs du service.</Text>
          <Text>
            <strong>
              Nous vous invitions à participer à un échange en visio d’une trentaine de minutes avec un membre de notre équipe pour répondre à quelques questions et nous partager
              votre avis.
            </strong>
          </Text>
          <Box mt="7">
            <Link
              href="https://calendly.com/rdv-labonnealternance/discussion-labonnealternance"
              aria-label="Planifier un échange avec l'équipe"
              title="Je participe à l'étude"
              color="#000091"
              border="1px solid #000091"
              padding="10px 24px"
              isExternal
            >
              Je participe à l'étude
            </Link>
          </Box>
          <Box mt="3">&nbsp;</Box>
        </GridItem>
      </Grid>
    </Box>
  )
}
export default AmeliorerLBA
