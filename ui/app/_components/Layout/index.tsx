"use server"
import { Box, Container, Flex } from "@chakra-ui/react"

import Footer from "@/components/footer"

import Header from "./Header"
import NavigationAdmin, { EAdminPages } from "./NavigationAdmin"
import NavigationMenu from "./NavigationMenu"

export default async function Layout({
  header = true,
  children,
  widget = false,
  footer = true,
  rdva = false,
  adminPage,
  displayNavigationMenu = true,
}: {
  children: React.ReactNode
  header?: boolean
  widget?: boolean
  footer?: boolean
  rdva?: boolean
  adminPage?: EAdminPages
  displayNavigationMenu?: boolean
}) {
  const handleLogout = async () => {
    "use server"
  }
  return (
    <Container maxW="full" p="0">
      <Flex direction="column" h="100vh">
        {!widget && (
          <Box as="header">
            {header && <Header onLogout={handleLogout} />}
            {displayNavigationMenu && <NavigationMenu rdva={rdva} />}
            {adminPage && <NavigationAdmin currentPage={adminPage} />}
          </Box>
        )}
        <Container as="main" p={0} maxW="container.xl" flexGrow="1">
          {children}
        </Container>
        {!widget && footer && <Footer />}
      </Flex>
    </Container>
  )
}
