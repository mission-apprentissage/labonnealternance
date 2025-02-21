import { Box, Container, Show } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { RechercheForm } from "./components/RechercheForm"

const HomeCircleImageDecoration = dynamic(() => import("@/components/HomeComponents/HomeCircleImageDecoration").then((mod) => mod.HomeCircleImageDecoration))
const AlgoHome = dynamic(() => import("@/components/HomeComponents/AlgoHome"))
const PromoRessources = dynamic(() => import("@/components/Ressources/promoRessources"))
const HowTo = dynamic(() => import("@/components/HowTo/HowTo"))
// const Footer = dynamic(() => import("@/components/footer"))
const AmeliorerLBA = dynamic(() => import("@/components/HomeComponents/AmeliorerLBA"))

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
      {/* <Navigation /> */}
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
