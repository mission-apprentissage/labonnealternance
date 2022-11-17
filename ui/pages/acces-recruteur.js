import { Box, Container, Text } from "@chakra-ui/react"
import React from "react"
import Breadcrumb from "../components/breadcrumb"
import AlgoRecruiter from "../components/HomeComponents/AlgoRecruiter"
import ConnectionActions from "../components/HomeComponents/ConnectionActions"
import Entreprise from "../components/HomeComponents/Entreprise"
import FollowLinkedIn from "../components/HomeComponents/FollowLinkedIn"
import GerezOffres from "../components/HomeComponents/GerezOffres"
import OffresGratuites from "../components/HomeComponents/OffresGratuites"
import OrganismesMandataires from "../components/HomeComponents/OrganismesMandataires"
import PostezVotreOffre from "../components/HomeComponents/PostezVotreOffre"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

import { NextSeo } from "next-seo"

import Footer from "../components/footer"

const AccesRecruteur = () => (
  <Box>
    <NextSeo
      title="Acces recruteur | La bonne alternance | Trouvez votre alternance"
      description="Exprimez votre besoin en alternance. Aucune inscription ne vous sera demandée."
    />

    <ScrollToTop />
    <Navigation currentPage="acces-recruteur" />
    <Breadcrumb forPage="acces-recruteur" label="Accès recruteur" />

    <Container my={0} px={0} variant="pageContainer" bg="white">
      <Entreprise />

      <Box as="section" p={{ base: 3, md: 6, lg: 12 }} borderRadius={10} bg="grey.100">
        <PostezVotreOffre />
        <OffresGratuites />
        <OrganismesMandataires />
      </Box>

      <GerezOffres />

      <Box>
        <AlgoRecruiter />
      </Box>

      <Box as="section" pb={24} backgroundColor="white">
        <Text as="h2" align="center" variant="homeEditorialH2">
          Vous souhaitez recruter un alternant pour votre entreprise ?
        </Text>
        <Box display="flex" justifyContent="center" alignItems="center">
          <ConnectionActions service="entreprise" />
        </Box>
      </Box>

      <Box as="section"></Box>

      <FollowLinkedIn />
    </Container>
    <Box mb={3}>&nbsp;</Box>
    <Footer />
  </Box>
)

export default AccesRecruteur
