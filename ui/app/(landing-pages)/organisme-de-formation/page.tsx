import { Box, Container, Text } from "@chakra-ui/react"
import type { Metadata } from "next"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { OffresGratuites } from "@/app/(espace-pro)/_components/OffresGratuites"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { BientotCFA } from "@/app/(landing-pages)/organisme-de-formation/_components/BientotCFA"
import { CFA } from "@/app/(landing-pages)/organisme-de-formation/_components/CFA"
import { FacilitezRDVA } from "@/app/(landing-pages)/organisme-de-formation/_components/FacilitezRDVA"
import { GerezEntreprise } from "@/app/(landing-pages)/organisme-de-formation/_components/GerezEntreprise"
import OffresAutoExposees from "@/app/(landing-pages)/organisme-de-formation/_components/OffresAutoExposees"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

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
