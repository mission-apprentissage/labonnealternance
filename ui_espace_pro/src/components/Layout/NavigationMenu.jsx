import { Box, Container, Flex, Link, Text } from "@chakra-ui/react"
import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { Close, MenuFill } from "../../theme/components/icons"

const NavigationMenu = (props) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  return (
    <NavBarContainer {...props} position={"relative"}>
      <NavToggle toggle={toggle} isOpen={isOpen} />
      <NavLinks isOpen={isOpen} />
    </NavBarContainer>
  )
}

const NavToggle = ({ toggle, isOpen }) => {
  return (
    <Box display={{ base: "block", md: "none" }} onClick={toggle} py={4} position={isOpen ? "absolute" : "relative"} top={0}>
      {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
    </Box>
  )
}

const NavItem = ({ children, to = "/", ...rest }) => {
  const { pathname } = useLocation()
  const isActive = pathname === to

  return (
    <Link
      p={3}
      as={NavLink}
      to={to}
      color={isActive ? "bluefrance.500" : "grey.800"}
      _hover={{ textDecoration: "none", bg: "grey.200" }}
      borderBottom="2px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  )
}

const NavLinks = ({ isOpen }) => {
  const [auth] = useAuth()

  if (auth.type === AUTHTYPE.OPCO) return null

  return (
    <Box display={{ base: isOpen ? "block" : "none", md: "block" }} flexBasis={{ base: "100%", md: "auto" }}>
      <Flex align="center" justify={["center", "center", "flex-end", "flex-end"]} direction={["column", "column", "row", "row"]} py={0} textStyle="sm">
        {auth.type === AUTHTYPE.CFA && <NavItem to="/administration">Entreprises partenaires</NavItem>}
        {auth.type === AUTHTYPE.ENTREPRISE && <NavItem to={`/administration/entreprise/${auth.id_form}`}>Gerer mes offres</NavItem>}
      </Flex>
    </Box>
  )
}

const NavBarContainer = ({ children, ...props }) => {
  return (
    <Box w="full" boxShadow="md">
      <Container maxW="container.xl">
        <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
          {children}
        </Flex>
      </Container>
    </Box>
  )
}

export default NavigationMenu
