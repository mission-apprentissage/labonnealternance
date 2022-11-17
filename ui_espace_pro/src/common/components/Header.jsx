import React from "react"
import { NavLink } from "react-router-dom"
import { Box, Container, Flex, Heading, Link } from "@chakra-ui/react"
import { Logo } from "./Logo"

const Header = () => {
  return (
    <>
      <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]}>
        <Container maxW="xl" py={[0, 2]} px={[0, 4]}>
          <Flex alignItems="center" color="grey.800">
            <Link as={NavLink} to="/" p={[4, 0]}>
              <Logo />
            </Link>
            <Box p={[1, 6]} flex="1">
              <Heading as="h6" textStyle="h6" fontSize="xl">
                Mise en relation entre les candidats à l'apprentissage et les CFA
              </Heading>
            </Box>
          </Flex>
        </Container>
      </Container>
    </>
  )
}

export default Header
