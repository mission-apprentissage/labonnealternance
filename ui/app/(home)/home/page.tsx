import { Box, Container, Show } from "@chakra-ui/react"

import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoHome } from "@/app/(home)/home/_components/AlgoHome"
import { AmeliorerLBA } from "@/app/(home)/home/_components/AmeliorerLBA"
import { HomeCircleImageDecoration } from "@/app/(home)/home/_components/HomeCircleImageDecoration"
import { HowTo } from "@/app/(home)/home/_components/HowTo"

import { RechercheForm } from "./_components/RechercheForm"

const blockCssProperties = {
  position: "relative",
  borderRadius: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: "1310px",
}
export default function HomePage() {
  return (
    <Box>
      <Box as="main">
        <Box background="beige" sx={blockCssProperties}>
          <Show above="lg">
            <HomeCircleImageDecoration />
          </Show>
          <Container variant="responsiveContainer" pt={{ base: 3, sm: 12 }} pb={12} position="relative">
            <RechercheForm />
          </Container>
          <HowTo />
        </Box>

        <Box sx={blockCssProperties} py={12}>
          <AlgoHome />
        </Box>

        <Box sx={blockCssProperties} pb={12}>
          <PromoRessources target="candidat" />
        </Box>

        <Box sx={blockCssProperties}>
          <AmeliorerLBA />
        </Box>
      </Box>
    </Box>
  )
}
