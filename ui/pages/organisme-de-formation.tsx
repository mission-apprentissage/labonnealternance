import { Box, Container, Text } from "@chakra-ui/react"
import { NextSeo } from "next-seo"

import OffresAutoExposees from "@/components/HomeComponents/OffresAutoExposees"
import PromoRessources from "@/components/Ressources/promoRessources"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import BientotCFA from "../components/HomeComponents/BientotCFA"
import CFA from "../components/HomeComponents/CFA"
import ConnectionActions from "../components/HomeComponents/ConnectionActions"
import FacilitezRDVA from "../components/HomeComponents/FacilitezRDVA"
import FollowLinkedIn from "../components/HomeComponents/FollowLinkedIn"
import GerezEntreprise from "../components/HomeComponents/GerezEntreprise"
import OffresGratuites from "../components/HomeComponents/OffresGratuites"
import Navigation from "../components/navigation"

const Organisme = () => {
  return (
    <Box>
      <NextSeo title="Organisme de formation | La bonne alternance | Trouvez votre alternance" description="Comment référencer ma formation ? Nous sommes là pour vous aider." />

      <Navigation currentPage="organisme-de-formation" />
      <Box as="main">
        <Breadcrumb forPage="organisme-de-formation" label="Organisme de formation" />

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

      <Footer />
    </Box>
  )
}
export default Organisme
