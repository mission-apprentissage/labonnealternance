import { Container, Flex } from "@chakra-ui/react"

import Footer from "@/components/footer"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

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
          <>
            {header && <Header />}
            {displayNavigationMenu && <NavigationMenu rdva={rdva} />}
          </>
        )}
        <Container maxW="container.xl" flexGrow="1">
          {children}
        </Container>
        {footer && (widget ? <WidgetFooter /> : <Footer />)}
      </Flex>
    </Container>
  )
}
