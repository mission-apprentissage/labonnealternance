import React from "react"
import { Box, Image, Text, Grid, GridItem, Link } from "@chakra-ui/react"

const FacilitezRDVA = () => {
  return (
    <>
      <Box>
        <Box bg="beige" borderRadius={10} p={12}>
          <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}>
            <GridItem>
              <Box display="flex" alignItems="center" justifyContent={{ base: "center", lg: "flex-end" }} mr={{ base: 0, lg: 4 }} height="100%">
                <Image src="/images/home_pics/facilitezRDVA.svg" alt="" width={{ base: "300px", lg: "420px" }}></Image>
              </Box>
            </GridItem>
            <GridItem>
              <Text as="h2" variant="homeEditorialH2" mt={{ base: 8, lg: 0 }}>
                Facilitez la prise de contact des jeunes intéressés par vos formations.
              </Text>
              <Text fontSize="18px" mt={4}>
                La bonne alternance propose à l’ensemble des formations référencées une fonctionnalité de prise de rendez-vous. Recevez directement dans votre boite mail des
                demandes de jeunes intéressés par vos formations.
              </Text>
              <Text fontSize="14px" mt={6}>
                *Ce service est automatiquement activé pour l’ensemble des formations référencées. La création de compte n’est pas nécessaire pour bénéficier de ce service.
              </Text>
            </GridItem>
          </Grid>
          <Box>
            <Grid templateColumns="repeat(24, 1fr)" mx={6} mt={6} p={3} bg="white" border="1px solid" borderColor="grey.300" borderRadius={10}>
              <GridItem colSpan={1} display="flex" alignItems="center" justifyContent="flex-end">
                <Image src="/images/info.svg" alt=""></Image>
              </GridItem>
              <GridItem colSpan={23} fontSize={{ base: "15px" }} lineHeight="28px" ml={2}>
                <Text>Vous souhaitez référencer votre formation, modifier vos coordonnées, être visible sur Parcoursup ?</Text>
                <Text mt={{ base: 2, lg: 0 }}>Vous souhaitez activer le service de demande de rendez-vous, consulter vos demandes de rendez-vous ?</Text>
                <Text mt={{ base: 2, lg: 0 }}>
                  <Link href="/faq" variant="homeEditorialLink">
                    Visitez notre FAQ
                  </Link>{" "}
                  pour trouver toutes les réponses à vos questions.
                </Text>
              </GridItem>
            </Grid>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default FacilitezRDVA
