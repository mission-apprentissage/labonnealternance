import { Box, Container, Grid, GridItem, Image, Show, Text } from "@chakra-ui/react"

export const HowTo = () => (
  <>
    <Container variant="responsiveContainer">
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={{ base: "10", md: "24" }}>
        <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto">
          <Image fetchPriority="low" src="/images/howto1.svg" alt="" zIndex="2" position="inherit" />
          <Show above="md">
            <Image fetchPriority="low" src="/images/howtoline1.svg" alt="" position="absolute" top="85px" left="-162px" />
          </Show>
          <Box>
            <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
              Le job de vos rêves
            </Text>
            <Text as="p">Renseignez le métier que vous souhaitez faire et la localisation (Ville ou Code postal)</Text>
          </Box>
        </GridItem>
        <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto">
          <Image fetchPriority="low" src="/images/howto2.svg" alt="" zIndex="2" position="inherit" />
          <Show above="md">
            <Image fetchPriority="low" src="/images/howtoline2a.svg" alt="" position="absolute" top="47px" left="-208px" />
          </Show>
          <Box>
            <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
              En un clin d’&oelig;il
            </Text>
            <Text as="p">Obtenez la liste des formations et entreprises où réaliser votre alternance</Text>
          </Box>
        </GridItem>
        <GridItem position="relative" width={{ base: "200px", md: "auto" }} mx="auto" mb="12">
          <Image fetchPriority="low" src="/images/howto3.svg" alt="" zIndex="2" position="inherit" />
          <Show above="md">
            <Image fetchPriority="low" src="/images/howtoline3a.svg" alt="" position="absolute" top="47px" left="-200px" />
            <Image fetchPriority="low" src="/images/howtoline3b.svg" alt="" position="absolute" top="47px" left="158px" />
          </Show>
          <Box>
            <Text as="h3" fontSize="1.25rem" fontWeight="500" mb="3">
              Un contact facile
            </Text>
            <Text as="p">Contactez facilement les centres de formation ou les entreprises pour postuler</Text>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  </>
)
