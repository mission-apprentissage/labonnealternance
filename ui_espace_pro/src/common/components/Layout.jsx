import React from "react"
import { Box, Container } from "@chakra-ui/react"
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
      <Header />
      <NavigationMenu />
      <Box minH={"60vh"}>{children}</Box>
      <Footer />
    </Container>
  )
}

export default Layout
