import { Box, Container, Show } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import React, { useEffect } from "react"

import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"
import StartForm from "../components/StartForm/StartForm"
import { ParameterContext } from "../context/ParameterContextProvider"
import { initParametersFromQuery } from "../services/config"

const HomeCircleImageDecoration = dynamic(() => import("@/components/HomeComponents/HomeCircleImageDecoration").then((mod) => mod.HomeCircleImageDecoration), { ssr: false })
const AlgoHome = dynamic(() => import("@/components/HomeComponents/AlgoHome"))
const PromoRessources = dynamic(() => import("@/components/Ressources/promoRessources"))
const HowTo = dynamic(() => import("@/components/HowTo"))
const Footer = dynamic(() => import("@/components/footer"))

const blockCssProperties = {
  position: "relative",
  borderRadius: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: "1310px",
}

const Home = () => {
  const router = useRouter()

  const parameterContext = React.useContext(ParameterContext)

  useEffect(() => {
    initParametersFromQuery({ router, shouldPush: "shouldPushPathname", parameterContext })
  }, [])

  return (
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

        {/* @ts-expect-error: TODO 
        <Box {...blockCssProperties}>
          <AmeliorerLBA />
        </Box>*/}
      </Box>

      <Footer />
    </Box>
  )
}

export default Home
