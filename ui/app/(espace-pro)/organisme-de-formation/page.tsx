import { Box, Container, Text } from "@chakra-ui/react"
import type { Metadata } from "next"

import BientotCFA from "../../../components/HomeComponents/BientotCFA"
import CFA from "../../../components/HomeComponents/CFA"
import ConnectionActions from "../../../components/HomeComponents/ConnectionActions"
import FacilitezRDVA from "../../../components/HomeComponents/FacilitezRDVA"
import FollowLinkedIn from "../../../components/HomeComponents/FollowLinkedIn"
import GerezEntreprise from "../../../components/HomeComponents/GerezEntreprise"
import OffresAutoExposees from "../../../components/HomeComponents/OffresAutoExposees"
import OffresGratuites from "../../../components/HomeComponents/OffresGratuites"
import PromoRessources from "../../../components/Ressources/promoRessources"
import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../_components/Breadcrumb"

export const metadata: Metadata = {
  title: PAGES.static.organismeDeFormation.getMetadata().title,
  description: PAGES.static.organismeDeFormation.getMetadata().description,
}

export default function OrganismeDeFormation() {
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.organismeDeFormation]} />
        <Container variant="pageContainer" bg="white">
          <CFA />

          <Box as="section" bg="beige" borderRadius={10} p={{ base: 3, md: 6, lg: 12 }} mt="16">
            <OffresAutoExposees />
            <FacilitezRDVA />
          </Box>

          <Box as="section" bg="beige" borderRadius={10} p={{ base: 3, md: 6, lg: 12 }} mt={16}>
            <GerezEntreprise />
            <OffresGratuites />
          </Box>

          <Box as="section">
            <BientotCFA />
          </Box>

          <Box as="section" backgroundColor="white" py={12}>
            <PromoRessources target="cfa" />
          </Box>

          <Box mt={4} mb={12}>
            <Text as="h2" textAlign="center" fontSize="32" fontWeight={700}>
              Vous souhaitez attirer de nouveaux candidats?
            </Text>
            <Box ml="4" display="flex" justifyContent="center" mt={2}>
              <ConnectionActions service="cfa" />
            </Box>
          </Box>

          <FollowLinkedIn />
        </Container>
      </Box>
    </Box>
  )
}
