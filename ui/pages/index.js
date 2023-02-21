import React, { useEffect } from "react"
import Navigation from "../components/navigation"
import HomeHero from "../components/HomeHero"
import HowTo from "../components/HowTo"
import AlgoHome from "../components/HomeComponents/AlgoHome"
import MetiersDAvenir from "../components/HomeComponents/MetiersDAvenir"
import { initParametersFromQuery } from "../services/config"
import Footer from "../components/footer"
import { useRouter } from "next/router"

import ScrollToTop from "../components/ScrollToTop"
import howtocircle1 from "../public/images/howtocircle1.svg"
import howtocircle2 from "../public/images/howtocircle2.svg"
import howtocircle3 from "../public/images/howtocircle3.svg"
import howtocircle4 from "../public/images/howtocircle4.svg"
import howtocircle5 from "../public/images/howtocircle5.svg"
import { ParameterContext } from "../context/ParameterContextProvider"
import AmeliorerLBA from "../components/HomeComponents/AmeliorerLBA"
import { Box, Image } from "@chakra-ui/react"
import config from "../config/config"

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
      <Box background="beige" {...blockCssProperties}>
        <Image src={howtocircle1} {...circleImgCssProperties} top="60px" left="50px" alt="" />
        <Image src={howtocircle2} {...circleImgCssProperties} bottom="-28px" left="444px" alt="" />
        <Image src={howtocircle3} {...circleImgCssProperties} top="182px" right="512px" alt="" />
        <Image src={howtocircle4} {...circleImgCssProperties} top="12px" right="312px" alt="" />
        <Image src={howtocircle5} {...circleImgCssProperties} bottom="112px" right="-12px" alt="" />
        <HomeHero />
        <HowTo />
      </Box>

      <Box {...blockCssProperties} pt={12} pb={0}>
        <MetiersDAvenir />
      </Box>

      <Box {...blockCssProperties} py={12}>
        <AlgoHome />
      </Box>

      {config.shouldDisplayCallForHelp && (
        <Box {...blockCssProperties}>
          <AmeliorerLBA />
        </Box>
      )}
      <Footer />
    </Box>
  )
}

export default Home
