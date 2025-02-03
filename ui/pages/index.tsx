import { Box, Container, Show } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"
import StartForm from "../components/StartForm/StartForm"

const HomeCircleImageDecoration = dynamic(() => import("@/components/HomeComponents/HomeCircleImageDecoration").then((mod) => mod.HomeCircleImageDecoration), { ssr: false })
const AlgoHome = dynamic(() => import("@/components/HomeComponents/AlgoHome"))
const PromoRessources = dynamic(() => import("@/components/Ressources/promoRessources"))
const HowTo = dynamic(() => import("@/components/HowTo/HowTo"))
const Footer = dynamic(() => import("@/components/footer"))
const AmeliorerLBA = dynamic(() => import("@/components/HomeComponents/AmeliorerLBA"))

const blockCssProperties = {
  position: "relative",
  borderRadius: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: "1310px",
}

const Home = () => (
  <Box>
    <ScrollToTop />
    <Navigation />
    <Box as="main">
      <Box background="beige" sx={blockCssProperties}>
        <Show above="lg">
          <HomeCircleImageDecoration />
        </Show>
        <Container variant="responsiveContainer" pt={{ base: 3, sm: 12 }} pb={12} position="relative">
          <StartForm />
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

    <Footer />
  </Box>
)

export default Home
