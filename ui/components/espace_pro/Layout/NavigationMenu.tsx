"use client"

import { Box, Container, Flex, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useState } from "react"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../common/contants"
import { Close, MenuFill } from "../../../theme/components/icons"
import Link from "../../Link"

const NavigationMenu = ({ rdva = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  return (
    <NavBarContainer {...props} position={"relative"}>
      <NavToggle toggle={toggle} isOpen={isOpen} />
      <NavLinks isOpen={isOpen} rdva={rdva} />
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
  const router = useRouter()
  const isActive = router.pathname === to

  return (
    <Link
      p={3}
      href={to}
      color={isActive ? "bluefrance.500" : "grey.800"}
      _hover={{ textDecoration: "bluefrance.500", bg: "grey.200" }}
      borderBottom="2px solid"
      borderColor={isActive ? "bluefrance" : "transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  )
}

const NavLinks = ({ isOpen, rdva = false }) => {
  const { user } = useAuth()
  if (!user) return null
  if (user.type === AUTHTYPE.OPCO) return null

  return (
    <Box display={{ base: isOpen ? "block" : "none", md: "block" }} flexBasis={{ base: "100%", md: "auto" }}>
      <Flex align="center" justify={["center", "center", "flex-end", "flex-end"]} direction={["column", "column", "row", "row"]} py={0} textStyle="sm">
        {user.type === AUTHTYPE.CFA && <NavItem to="/espace-pro/administration">Entreprises partenaires</NavItem>}
        {user.type === AUTHTYPE.ENTREPRISE && <NavItem to={`/espace-pro/administration/entreprise/${user.establishment_id}`}>Gerer mes offres</NavItem>}
        {user.type === AUTHTYPE.ADMIN && rdva && <NavItem to={`/espace-pro/admin/eligible-trainings-for-appointment/search`}>Rechercher / modifier un siret formateur</NavItem>}
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
