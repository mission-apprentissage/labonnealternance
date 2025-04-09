import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react"

export function BientotCFA() {
  return (
    <Box bg="beige" mt="16" borderRadius="10" px={{ base: 3, md: 6, lg: 12 }} pt={{ base: 12, lg: 0 }} pb={{ base: 12, lg: 10 }}>
      <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }} templateRows={{ base: "auto", lg: "repeat(5, 1fr)" }}>
        <GridItem gridColumn={{ base: "1fr", lg: "1 / 3" }} gridRow={{ base: "auto", lg: "1 / 6" }} order={{ base: "2", md: "auto" }} mt={{ base: 6, lg: 0 }}>
          <Box display="flex" alignItems="center" justifyContent="center" height="100%" mr={{ base: 0, lg: 6 }}>
            <Image src="/images/home_pics/illu-candidatures.svg" alt="" aria-hidden={true} width={{ base: "320px", lg: "511px" }} />
          </Box>
        </GridItem>
        <GridItem gridColumn={{ base: "1fr", lg: "3 / 5" }} gridRow={{ base: "auto", lg: "1 / 1" }} order={{ base: "1", md: "auto" }} mt={0}>
          <Box display="flex" alignItems="flex-end" justifyContent="flex-start" height="100%">
            <Text mb="2" bg="linear-gradient(90deg, #6A11CB 0%, #2575FC 100%);" color="white" borderRadius={40} fontSize={20} px={4} fontWeight={700}>
              Bientôt
            </Text>
          </Box>
        </GridItem>
        <GridItem gridColumn={{ base: "1fr", lg: "3 / 5" }} gridRow={{ base: "auto", lg: "2 / 4" }} order={{ base: "3", md: "auto" }} mt={{ base: 6, lg: 0 }}>
          <Text as="h2" variant="homeEditorialH2">
            Gérez vos offres de manière collaborative
          </Text>
          <Text>Un accès multi-comptes permettra à plusieurs personnes d’accéder et de gérer vos offres d’emploi.</Text>
        </GridItem>
        <GridItem gridColumn={{ base: "1fr", lg: "3 / 5" }} gridRow={{ base: "auto", lg: "4 / 6" }} order={{ base: "4", md: "auto" }} mt={{ base: 6, lg: 0 }}>
          <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
            <Text as="h2" variant="homeEditorialH2">
              Administrez les demandes de RDV des candidats sur vos formations
            </Text>
            <Text>Gérez dans votre espace personnel les demandes de rendez-vous envoyées par les candidats intérressés par vos offres d’emploi et de formation.</Text>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  )
}
