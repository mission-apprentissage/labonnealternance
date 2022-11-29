import { useRouter } from "next/router"
import React from "react"
import { Box, Image, GridItem, Grid, Link, UnorderedList, ListItem, Flex, Divider } from "@chakra-ui/react"

const Footer = () => {
  const router = useRouter()

  return (
    <Box as="footer" borderTop="1px solid" borderTopColor="info" pt={6}>
      <Box maxWidth="1350px" mx="auto" pl={{ base: 0, lg: 6 }}>
        <Box as="nav" pl={{ base: 8, lg: 0 }}>
          <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}>
            <GridItem colSpan={{ base: 1, lg: 1 }}>
              <Image src="/images/marianne.svg#svgView(viewBox(12 0 162 78))" alt="" width="290" height="130" />
            </GridItem>
            <GridItem colSpan={{ base: 1, lg: 1 }}>
              <Box pl={{ base: 0, lg: 2 }} height="100%" display="flex" alignItems="center">
                <Image src="/images/france_relance.svg" alt="" width="81" height="81" />
              </Box>
            </GridItem>
            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <Box pl={{ base: 0, lg: 4 }} mt={{ base: 8, lg: 0 }}>
                <Box fontSize="14px" color="grey.800">
                  La bonne alternance. Trouvez votre alternance.
                </Box>
                <Box fontSize="14px" color="grey.800" mt="6">
                  La bonne alternance est proposée par les services suivants :
                </Box>
                <Flex flexDirection={{ base: "column", lg: "row" }} mt="6">
                  <Link href="https://pole-emploi.fr" aria-label="Accès au site de Pôle emploi" isExternal fontSize={14} fontWeight={700} color="grey.425" mr={4}>
                    pole-emploi.fr
                  </Link>
                  <Link href="https://gouvernement.fr" aria-label="Accès au site gouvernement.fr" isExternal fontSize={14} fontWeight={700} color="grey.425" mr={4}>
                    gouvernement.fr
                  </Link>
                  <Link href="https://service-public.fr" aria-label="Accès au site service-public.fr" isExternal fontSize={14} fontWeight={700} color="grey.425" mr={4}>
                    service-public.fr
                  </Link>
                  <Link href="https://data.gouv.fr" aria-label="Accès au site data.gouv" isExternal fontSize={14} fontWeight={700} color="grey.425" mr={4}>
                    data.gouv.fr
                  </Link>
                </Flex>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
      <Divider mt={6} mb={3}></Divider>
      <Box maxWidth="1350px" mx="auto" pl={{ base: 0, lg: 6 }}>
        <Box as="nav" pl={{ base: 8, lg: 0 }}>
          <Grid>
            <GridItem>
              <UnorderedList listStyleType="none" color="grey.425" fontSize={12} marginInlineStart={0}>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                >
                  <Link href="/mentions-legales" aria-label="Accès aux mentions légales">
                    Mentions légales
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/cgu" aria-label="Accès aux conditions générales d'utilisation">
                    CGU
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/cookies" aria-label="Accès à la page Cookies">
                    Cookies
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/stats" aria-label="Accès aux statistiques du service">
                    Statistiques
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/faq" aria-label="Accès à la foire aux questions">
                    FAQ
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/contact" aria-label="Accès à la page Contact">
                    Contact
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/metiers" aria-label="Accès à la page Métiers">
                    Métiers
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/a-propos" aria-label="Accès à la page A propos">
                    A propos
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link href="/developpeurs" aria-label="Accès à la page Développeurs">
                    Développeurs
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 4 }}
                  paddingLeft={{ base: 0, lg: 4 }}
                >
                  <Link>Accessibilité : non conforme</Link>
                </ListItem>
              </UnorderedList>
            </GridItem>
            <GridItem>
              <Box color="grey.425" fontSize={12} mt={6} pb={12}>
                Sauf mention contraire, tous les contenus de ce site sont sous licence{" "}
                <Link
                  href="https://www.etalab.gouv.fr/licence-version-2-0-de-la-licence-ouverte-suite-a-la-consultation-et-presentation-du-decret"
                  aria-label="Accès au site Etalab"
                  textDecor="underline"
                >
                  etalab-2.0
                  <Image src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" display="inline-block" pl="1" />
                </Link>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
