import { Box, Container, Text } from "@chakra-ui/react"
import type { Metadata } from "next"

import AlgoRecruiter from "@/components/HomeComponents/AlgoRecruiter"
import ConnectionActions from "@/components/HomeComponents/ConnectionActions"
import Entreprise from "@/components/HomeComponents/Entreprise"
import FollowLinkedIn from "@/components/HomeComponents/FollowLinkedIn"
import GerezOffres from "@/components/HomeComponents/GerezOffres"
import OffresGratuites from "@/components/HomeComponents/OffresGratuites"
import OrganismesMandataires from "@/components/HomeComponents/OrganismesMandataires"
import PostezVotreOffre from "@/components/HomeComponents/PostezVotreOffre"
import PromoRessources from "@/components/Ressources/promoRessources"

import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../_components/Breadcrumb"

export const metadata: Metadata = {
  title: PAGES.static.accesRecruteur.getMetadata().title,
  description: PAGES.static.accesRecruteur.getMetadata().description,
}

export default function AccesRecruteur() {
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.accesRecruteur]} />
        <Container my={0} px={0} variant="pageContainer" bg="white">
          <Entreprise />

          <Box as="section" p={{ base: 3, md: 6, lg: 12 }} borderRadius={10} bg="grey.100">
            <PostezVotreOffre />
            <OffresGratuites />
            <OrganismesMandataires />
          </Box>

          <GerezOffres />

          <Box>
            <AlgoRecruiter withLinks={true} />
          </Box>

          <Box as="section" backgroundColor="white" pb={12}>
            <PromoRessources target="recruteur" />
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
      </Box>
    </Box>
  )
}
