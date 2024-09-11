import { CloseIcon, HamburgerIcon, LockIcon } from "@chakra-ui/icons"
import { Box, Container, Flex, Image, Stack, useDisclosure } from "@chakra-ui/react"
import NextLink from "next/link"

import { LbaNew } from "../theme/components/logos"

import InfoBanner from "./InfoBanner/InfoBanner"

const Pipe = () => (
  <Box display={["none", "none", "none", "block"]} borderRight="1px solid" borderColor="grey.300" my="6" marginTop="10px !important;" marginBottom="10px !important;"></Box>
)

const Navigation = ({ currentPage = undefined }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box
      sx={
        ["organisme-de-formation", "acces-recruteur"].includes(currentPage)
          ? {
              boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
            }
          : {}
      }
      as="header"
    >
      <InfoBanner />
      <Container variant="responsiveContainer">
        <Flex py={2} direction={["column", "column", "column", "row"]} justify="space-between">
          <Flex alignItems="center" wrap="wrap">
            <Flex flexGrow={1}>
              <Flex alignItems="center">
                <NextLink href="/" aria-label="Retour à l'accueil">
                  <Image src="/images/marianne.svg" aria-hidden={true} alt="" width="108" height="90" />
                </NextLink>
                <NextLink href="/" aria-label="Retour à l'accueil">
                  <LbaNew ml={4} w={["75%", "143px"]} h="37px" />
                </NextLink>
              </Flex>
            </Flex>
            <HamburgerIcon
              boxSize={6}
              onClick={isOpen ? onClose : onOpen}
              display={[isOpen ? "none" : "inline", isOpen ? "none" : "inline", isOpen ? "none" : "inline", "none"]}
              cursor="pointer"
            />
            <CloseIcon
              boxSize={4}
              mr={1}
              onClick={isOpen ? onClose : onOpen}
              display={[isOpen ? "inline" : "none", isOpen ? "inline" : "none", isOpen ? "inline" : "none", "none"]}
              cursor="pointer"
            />
          </Flex>
          <Box display={[isOpen ? "block" : "none", isOpen ? "block" : "none", isOpen ? "block" : "none", "block"]}>
            <Box display={["block", "block", "block", "flex"]} alignItems="center" height="100%">
              <Stack align="left" direction={["column", "column", "column", "row"]} mb={[2, 2, 2, 0]}>
                <NextLink href="/" aria-label="Accès espace candidat">
                  <Box display="inline-grid">
                    <Box as="span" ml={[0, 0, 0, 2]} mr="1" color="bluefrance.500" fontSize={14} pl={[1, 1, 1, 3]} pr={3} py={2} bg={!currentPage ? "#00000014" : "none"}>
                      Candidat
                    </Box>
                  </Box>
                </NextLink>
                <Pipe />
                <NextLink href="/acces-recruteur" aria-label="Accès espace recruteur">
                  <Box display="inline-grid">
                    <Box
                      as="span"
                      ml={[0, 0, 0, 2]}
                      mr="1"
                      color="bluefrance.500"
                      fontSize={14}
                      pl={[1, 1, 1, 3]}
                      pr={3}
                      py={2}
                      bg={currentPage === "acces-recruteur" ? "#00000014" : "none"}
                    >
                      Recruteur
                    </Box>
                  </Box>
                </NextLink>
                <Pipe />
                <NextLink href="/organisme-de-formation" aria-label="Accès espace organisme de formation">
                  <Box display="inline-grid">
                    <Box
                      as="span"
                      ml={[0, 0, 0, 2]}
                      mr="1"
                      color="bluefrance.500"
                      fontSize={14}
                      pl={[1, 1, 1, 3]}
                      pr={3}
                      py={2}
                      bg={currentPage === "organisme-de-formation" ? "#00000014" : "none"}
                    >
                      Organisme de formation
                    </Box>
                  </Box>
                </NextLink>
                {currentPage === "acces-recruteur" || currentPage === "organisme-de-formation" ? (
                  <>
                    <Pipe />
                    <NextLink href="/espace-pro/authentification" aria-label="Espace pro">
                      <Flex alignItems="center">
                        <LockIcon color="bluefrance.500" ml={{ base: 0, lg: 3 }} />
                        <Box as="span" color="bluefrance.500" fontSize={14} pl={[1, 1, 1, 2]} pr={2} py={2}>
                          Connexion
                        </Box>
                      </Flex>
                    </NextLink>
                  </>
                ) : (
                  ""
                )}
              </Stack>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default Navigation
