import { Box, Container, Flex } from "@chakra-ui/react"

import Footer from "@/components/footer"

import Header from "./Header"
import NavigationMenu from "./NavigationMenu"

/**
 * @description Layout components.
 * @param {JSX.Element} children
 * @param {boolean} widget
 * @param {boolean} footer
 * @param {boolean} displayNavigationMenu
 * @return {JSX.Element}
 */
export default function Layout({
  header = true,
  children,
  widget = false,
  footer = true,
  rdva = false,
  displayNavigationMenu = true,
}: {
  children: React.ReactNode
  header?: boolean
  widget?: boolean
  footer?: boolean
  rdva?: boolean
  displayNavigationMenu?: boolean
}) {
  return (
    <Container maxW="full" p="0">
      <Flex direction="column" h="100vh">
        {!widget && (
          <Box as="header">
            {header && <Header />}
            {displayNavigationMenu && <NavigationMenu rdva={rdva} />}
          </Box>
        )}
        <Container as="main" maxW="container.xl" flexGrow="1">
          {children}
        </Container>
        {!widget && footer && <Footer />}
      </Flex>
    </Container>
  )
}
