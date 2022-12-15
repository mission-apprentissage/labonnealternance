import { Box, Flex, Image, Link, useDisclosure, Stack, Show, Container, keyframes, usePrefersReducedMotion } from "@chakra-ui/react"
import NextLink from "next/link"

import { CloseIcon, HamburgerIcon, LockIcon } from "@chakra-ui/icons"

const Navigation = ({ currentPage }) => {
  const getLogo = () => {
    let logo = "logo_LBA_candidat.svg"

    if (currentPage === "acces-recruteur") {
      logo = "logo_LBA_recruteur.svg"
    } else if (currentPage === "organisme-de-formation") {
      logo = "logo_LBA_cfa.svg"
    }

    return logo
  }

  const getLogoTargetUrl = () => {
    let url = "/"
    if (currentPage === "acces-recruteur" || currentPage === "organisme-de-formation") {
      url += currentPage
    }

    return url
  }

  const { isOpen, onOpen, onClose } = useDisclosure()

  const spin = keyframes`
     0% {
          opacity: 0;
     }

     100% {
          opacity: 1;
     }
  `
  const prefersReducedMotion = usePrefersReducedMotion()
  const animation = prefersReducedMotion ? undefined : `${spin} .7s`

  return (
    <Box>
      <Container variant="responsiveContainer">
        <Flex py={2} direction={["column", "column", "column", "row"]} justify="space-between">
          <Flex alignItems="center" wrap="wrap">
            <Flex flexGrow={1}>
              <Box ml={0} display="flex" alignItems="center">
                <NextLink passHref href={{ pathname: "/" }}>
                  <Link aria-label="Retour à l'accueil">
                    <Image src="/images/marianne.svg#svgView(viewBox(12 0 162 78))" alt="" width="162" height="78" />
                  </Link>
                </NextLink>
                <Show above="md">
                  <NextLink passHref href={{ pathname: getLogoTargetUrl() }}>
                    <Link aria-label="Retour">
                      <Image src={`/images/${getLogo()}`} alt="Redirection vers la page d'accueil" width="150" height="57" ml={4} />
                    </Link>
                  </NextLink>
                </Show>
              </Box>
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
          <Box animation={animation} display={[isOpen ? "block" : "none", isOpen ? "block" : "none", isOpen ? "block" : "none", "block"]}>
            <Box display={["block", "block", "block", "flex"]} alignItems="center" height="100%">
              <Stack align="left" direction={["column", "column", "column", "row"]} mb={[2, 2, 2, 0]}>
                <NextLink passHref href={{ pathname: "/" }}>
                  <Link aria-label="Accès espace candidat" display="inline-grid">
                    <Box as="span" ml={[0, 0, 0, 2]} mr="1" color="bluefrance.500" fontSize={14} pl={[1, 1, 1, 3]} pr={3} py={2} bg={!currentPage ? "#00000014" : "none"}>
                      Candidat
                    </Box>
                  </Link>
                </NextLink>
                <Box display={["none", "none", "none", "block"]} borderRight="1px solid" borderColor="grey.300" marginTop="10px !important;" marginBottom="10px !important;"></Box>
                <NextLink passHref href={{ pathname: "/acces-recruteur" }}>
                  <Link aria-label="Accès espace recruteur" display="inline-grid">
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
                  </Link>
                </NextLink>
                <Box
                  display={["none", "none", "none", "block"]}
                  borderRight="1px solid"
                  borderColor="grey.300"
                  my="6"
                  marginTop="10px !important;"
                  marginBottom="10px !important;"
                ></Box>
                <NextLink passHref href={{ pathname: "/organisme-de-formation" }}>
                  <Link aria-label="Accès espace organisme de formation" display="inline-grid">
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
                  </Link>
                </NextLink>
                {currentPage === "acces-recruteur" || currentPage === "organisme-de-formation" ? (
                  <>
                    <Box
                      display={["none", "none", "none", "block"]}
                      borderRight="1px solid"
                      borderColor="grey.300"
                      my="6"
                      marginTop="10px !important;"
                      marginBottom="10px !important;"
                    ></Box>
                    <Link href="/espace-pro/authentification" pl={[1, 1, 1, 3]} cursor="pointer" display="flex" alignItems="center" alt="Espace pro" isExternal>
                      <LockIcon color="bluefrance.500" />
                      <Box as="span" color="bluefrance.500" fontSize={14} pl={[1, 1, 1, 2]} pr={2} py={2}>
                        Connexion
                      </Box>
                    </Link>
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
