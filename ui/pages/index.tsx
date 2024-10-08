import { Box, Container, Image } from "@chakra-ui/react"
import { useRouter } from "next/router"
import React, { useEffect } from "react"

import Footer from "../components/footer"
import AlgoHome from "../components/HomeComponents/AlgoHome"
import HowTo from "../components/HowTo"
import Navigation from "../components/navigation"
import PromoRessources from "../components/Ressources/promoRessources"
import ScrollToTop from "../components/ScrollToTop"
import StartForm from "../components/StartForm/StartForm"
import { ParameterContext } from "../context/ParameterContextProvider"
import { initParametersFromQuery } from "../services/config"

const blockCssProperties = {
  position: "relative",
  borderRadius: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  maxWidth: "1310px",
}

const circleImgCssProperties = {
  position: "absolute",
  zIndex: 0,
  display: {
    base: "none",
    lg: "block",
  },
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
        {/* @ts-expect-error: TODO */}
        <Box background="beige" {...blockCssProperties}>
          {/* @ts-expect-error: TODO */}
          <Image src="/images/howtocircle1.svg" {...circleImgCssProperties} top="60px" left="50px" alt="" />
          {/* @ts-expect-error: TODO */}
          <Image src="/images/howtocircle2.svg" {...circleImgCssProperties} bottom="-28px" left="444px" alt="" />
          {/* @ts-expect-error: TODO */}
          <Image src="/images/howtocircle3.svg" {...circleImgCssProperties} top="182px" right="512px" alt="" />
          {/* @ts-expect-error: TODO */}
          <Image src="/images/howtocircle4.svg" {...circleImgCssProperties} top="12px" right="312px" alt="" />
          {/* @ts-expect-error: TODO */}
          <Image src="/images/howtocircle5.svg" {...circleImgCssProperties} bottom="112px" right="-12px" alt="" />
          <Box backgroundSize="contain" backgroundRepeat="no-repeat">
            <Container variant="responsiveContainer" pt={{ base: 3, sm: 12 }} pb={12} position="relative">
              <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pb={6} pt={[2, 2, 2, 6]} px={4} bg="white" backgroundClip="border-box" borderRadius="10px">
                <StartForm />
              </Box>
            </Container>
          </Box>
          <HowTo />
        </Box>
        {/* @ts-expect-error: TODO */}
        <Box {...blockCssProperties} py={12}>
          <AlgoHome />
        </Box>

        {/* @ts-expect-error: TODO */}
        <Box {...blockCssProperties} pb={12}>
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
