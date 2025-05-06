import { Box, Container } from "@chakra-ui/react"
import React, { type PropsWithChildren } from "react"

import Footer from "@/components/footer"
import InfoBanner from "@/components/InfoBanner/InfoBanner"

import Header from "./Header"
import NavigationMenu from "./NavigationMenu"

const Layout = ({ children }: PropsWithChildren) => {
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
