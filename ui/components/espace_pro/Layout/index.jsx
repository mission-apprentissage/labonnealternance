import { Box, Container, Divider, Flex, Spacer } from "@chakra-ui/react"
import { Outlet } from "react-router-dom"
import Footer from "./Footer"
import Header from "./Header"
import Mission from "./Mission"
import NavigationMenu from "./NavigationMenu"

/**
 * @description Layout components.
 * @param {JSX.Element} children
 * @param {boolean} widget
 * @param {boolean} footer
 * @param {boolean} displayNavigationMenu
 * @return {JSX.Element}
 */
export default ({ header = true, children, widget, footer = true, displayNavigationMenu = true }) => (
  <Container maxW="full" p="0">
    <Flex direction="column" h="100vh">
      {!widget && (
        <>
          {header && <Header />}
          {displayNavigationMenu && <NavigationMenu />}
        </>
      )}
      <Container maxW="container.xl" flexGrow="1">
        {children ?? <Outlet />}
      </Container>
      {!widget && footer && (
        <>
          <Box>
            <Spacer />
            <Mission />
            <Divider />
            <Footer />
          </Box>
        </>
      )}
    </Flex>
  </Container>
)
