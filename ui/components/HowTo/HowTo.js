import React from "react"
import howto1 from "../../public/images/howto1.svg"
import howto2 from "../../public/images/howto2.svg"
import howto3 from "../../public/images/howto3.svg"
import howtoline1 from "../../public/images/howtoline1.svg"
import howtoline2a from "../../public/images/howtoline2a.svg"
import howtoline3a from "../../public/images/howtoline3a.svg"
import howtoline3b from "../../public/images/howtoline3b.svg"
import { Image, Text, GridItem, Grid, Container, Box, Show } from "@chakra-ui/react"

const HowTo = () => {
  return (
    <>
      <Container variant="responsiveContainer">
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={{ base: "10", md: "24" }}>
          <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto">
            <Image src={howto1} alt="" zIndex="2" position="inherit" />
            <Show above="md">
              <Image src={howtoline1} alt="" position="absolute" top="85px" left="-162px" />
            </Show>
            <Box>
              <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
                Le job de vos rêves
              </Text>
              <Text as="p">Renseignez le métier que vous souhaitez faire et la localisation (Ville ou Code postal)</Text>
            </Box>
          </GridItem>
          <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto">
            <Image src={howto2} alt="" zIndex="2" position="inherit" />
            <Show above="md">
              <Image src={howtoline2a} alt="" position="absolute" top="47px" left="-208px" />
            </Show>
            <Box>
              <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
                En un clin d’&oelig;il
              </Text>
              <Text as="p">Obtenez la liste des formations et entreprises proches de chez vous dans le domaine recherché.</Text>
            </Box>
          </GridItem>
          <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto" mb="12">
            <Image src={howto3} alt="" zIndex="2" position="inherit" />
            <Show above="md">
              <Image src={howtoline3a} alt="" position="absolute" top="47px" left="-200px" />
              <Image src={howtoline3b} alt="" position="absolute" top="47px" left="158px" />
            </Show>
            <Box>
              <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
                Un contact facile
              </Text>
              <Text as="p">Contactez facilement les centres de formation ou les entreprises pour postuler </Text>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </>
  )
}

export default HowTo
