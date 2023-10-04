import { Box, Container, Flex, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import React, { useState } from "react"

import { MenuFill, Close } from "../../../../theme/components/icons"
import Link from "../../../Link"

const NavigationMenu = ({ ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  return (
    <NavBarContainer {...props}>
      <NavToggle toggle={toggle} isOpen={isOpen} />
      <NavLinks isOpen={isOpen} />
    </NavBarContainer>
  )
}

const NavToggle = ({ toggle, isOpen }) => {
  return (
    <Box display={{ base: "block", md: "none" }} onClick={toggle} py={4}>
      {isOpen ? <Close boxSize={8} /> : <MenuFill boxSize={8} />}
    </Box>
  )
}

const NavItem = ({ children, to = "/", isMyWorkspace = false, ...rest }) => {
  const router = useRouter()
  const isActive = router.pathname === to

  return (
    <Link
      p={4}
      href={to}
      color={isActive || isMyWorkspace ? "bluefrance" : "grey.800"}
      _hover={{ textDecoration: "none", color: "grey.800", bg: "grey.200" }}
      borderBottom="3px solid"
      borderColor={isActive || isMyWorkspace ? "bluefrance" : "transparent"}
      bg={"transparent"}
    >
      <Text display="block" {...rest}>
        {children}
      </Text>
    </Link>
  )
}

const NavLinks = ({ isOpen }) => {
  return (
    <Box display={{ base: isOpen ? "block" : "none", md: "block" }} flexBasis={{ base: "100%", md: "auto" }}>
      <Flex align="center" justify={["center", "space-between", "flex-end", "flex-end"]} direction={["column", "row", "row", "row"]} pb={[8, 0]} textStyle="sm">
        <NavItem to="/">Accueil</NavItem>
      </Flex>
    </Box>
  )
}

const NavBarContainer = ({ children, isMyWorkspace = false, ...props }) => {
  const boxProps = !isMyWorkspace
    ? {
        boxShadow: "md",
      }
    : {
        borderBottom: "1px solid",
        borderColor: "bluefrance",
      }
  return (
    <Box w="full" {...boxProps}>
      <Container maxW="xl">
        <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" {...props}>
          {children}
        </Flex>
      </Container>
    </Box>
  )
}

export default NavigationMenu
