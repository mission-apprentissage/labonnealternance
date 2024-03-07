import { Box, Image, Text, Grid, GridItem } from "@chakra-ui/react"
import React from "react"

import Link from "../Link"

const OffresAutoExposees = () => {
  return (
    <>
      <Box>
        <Box bg="beige" borderRadius={10} p={{ base: 3, md: 6, lg: 12 }}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
            <GridItem colSpan={{ base: 1, md: 7 }}>
              <Box display="flex" alignItems="center" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
                <Image src="/images/home_pics/illu-offreformation.svg" aria-hidden={true} alt=""></Image>
              </Box>
            </GridItem>
            <GridItem colSpan={{ base: 1, md: 5 }}>
              <Text as="h2" variant="homeEditorialH2" mt={{ base: 8, lg: 0 }}>
                Vos formations en alternance sont automatiquement exposées
              </Text>
              <Text fontSize="18px" mt={4}>
                Pour référencer et mettre à jour vos formations sur La bonne alternance, nul besoin de vous créer un compte, il vous suffit de les déclarer auprès du Carif-Oref de
                votre région.
                <br />
                <br />
                Elles sont ensuite nationalement agrégées par le Réseau des Carif-Oref puis automatiquement exposées sur La bonne alternance.{" "}
                <Link href="/faq#cfa" variant="basicUnderlined">
                  En savoir plus
                </Link>
              </Text>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </>
  )
}

export default OffresAutoExposees
