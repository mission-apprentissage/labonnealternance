import { Box, Container } from "@chakra-ui/react"
import React from "react"

import InfoBanner from "@/components/InfoBanner/InfoBanner"

import Footer from "./Footer"
import Header from "./Header"
import NavigationMenu from "./NavigationMenu"

/**
 * @description Beta layout component.
 * @param {JSX.Element} children
 * @return {JSX.Element}
 */
const Layout = ({ children }) => {
  return (
    <Container maxW="full">
      <InfoBanner showInfo={false} />
      <Header />
      <NavigationMenu />
      <Box minH={"60vh"}>{children}</Box>
      <Footer />
    </Container>
  )
}

export default Layout
