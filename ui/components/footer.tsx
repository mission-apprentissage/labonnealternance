import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Container, Divider, Flex, Grid, GridItem, Image, Link, ListItem, UnorderedList } from "@chakra-ui/react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { publicConfig } from "../config.public"

const firstBasicLink = {
  mt: { base: 3, lg: 0 },
  display: { base: "inherit", lg: "inline-block" },
  borderRight: { base: "none", lg: "1px solid" },
  borderRightColor: { base: "none", lg: "grey.300" },
  paddingRight: { base: 0, lg: 4 },
}

const basicLink = {
  ...firstBasicLink,
  paddingLeft: { base: 0, lg: 4 },
}

const lastLink = {
  display: { base: "inherit", lg: "inline-block" },
  mt: { base: 3, lg: 3 },
  // paddingRight: { base: 0, lg: 4 },
  paddingLeft: { base: 0, lg: 4 },
}

const Footer = () => {
  const { pathname } = useRouter()
  const [ressource, setRessource] = useState<string>()

  useEffect(() => {
    if (pathname === "/acces-recruteur") {
      setRessource("recruter")
    }
    if (pathname === "/organisme-de-formation") {
      setRessource("cfa")
    }
  }, [])

  return (
    <Box as="footer" borderTop="1px solid" borderTopColor="info" paddingTop={6} marginTop={12}>
      <Container variant={"responsiveContainer"}>
        <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}>
          <GridItem>
            <Image src="/images/marianne.svg" aria-hidden={true} alt="" width="134" height="122" />
          </GridItem>
          <GridItem display="flex" height="100%" alignItems="center">
            <Image src="/images/france_relance.svg" alt="" width="81" height="81" />
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
                <Link
                  href="https://www.francetravail.fr"
                  aria-label="Accès au site de France Travail - nouvelle fenêtre"
                  isExternal
                  fontSize={14}
                  fontWeight={700}
                  color="grey.425"
                  mr={4}
                >
                  francetravail.fr <ExternalLinkIcon mx="2px" />
                </Link>
                <Link
                  href="https://gouvernement.fr"
                  aria-label="Accès au site gouvernement.fr - nouvelle fenêtre"
                  isExternal
                  fontSize={14}
                  fontWeight={700}
                  color="grey.425"
                  mr={4}
                >
                  gouvernement.fr <ExternalLinkIcon mx="2px" />
                </Link>
                <Link
                  href="https://service-public.fr"
                  aria-label="Accès au site service-public.fr - nouvelle fenêtre"
                  isExternal
                  fontSize={14}
                  fontWeight={700}
                  color="grey.425"
                  mr={4}
                >
                  service-public.fr <ExternalLinkIcon mx="2px" />
                </Link>
                <Link href="https://data.gouv.fr" aria-label="Accès au site data.gouv - nouvelle fenêtre" isExternal fontSize={14} fontWeight={700} color="grey.425" mr={4}>
                  data.gouv.fr <ExternalLinkIcon mx="2px" />
                </Link>
              </Flex>
            </Box>
          </GridItem>
        </Grid>

        <Divider mt={6} mb={3}></Divider>

        <Grid>
          <GridItem>
            <UnorderedList listStyleType="none" color="grey.425" fontSize={12} m={0}>
              <ListItem {...firstBasicLink}>
                <NextLink legacyBehavior passHref href="/mentions-legales">
                  <Link aria-label="Accès aux mentions légales">Mentions légales</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/cgu">
                  <Link aria-label="Accès aux conditions générales d'utilisation">CGU</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/politique-de-confidentialite">
                  <Link aria-label="Accès à la politique de confidentialité">Politique de confidentialité</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/stats">
                  <Link aria-label="Accès aux statistiques du service">Statistiques</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/faq">
                  <Link aria-label="Accès à la foire aux questions">FAQ</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href={{ pathname: "/ressources", hash: ressource }}>
                  <Link aria-label="Accès à la page Ressources">Ressources</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="https://mission-apprentissage.notion.site/Blog-f583f6fb051843bc8e3097b2e8bab9e3?pvs=25">
                  <Link isExternal aria-label="Accès au blog de La bonne alternance">
                    Blog
                  </Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/contact">
                  <Link aria-label="Accès à la page Contact">Contact</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/metiers">
                  <Link aria-label="Accès à la page Métiers">Métiers</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/a-propos">
                  <Link aria-label="Accès à la page A propos">A propos</Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref target="_blank" href="https://github.com/mission-apprentissage/labonnealternance">
                  <Link aria-label="Notre code source" isExternal>
                    Code source
                    <ExternalLinkIcon mx="2px" />
                  </Link>
                </NextLink>
              </ListItem>
              <ListItem {...basicLink}>
                <NextLink legacyBehavior passHref href="/nos-donnees">
                  <Link aria-label="Accès à nos données">Nos données</Link>
                </NextLink>
              </ListItem>
              <ListItem {...lastLink}>
                <NextLink legacyBehavior passHref href="/accessibilite">
                  <Link aria-label="Accès à la déclaration d'accessibilité">Accessibilité: non conforme</Link>
                </NextLink>
              </ListItem>
            </UnorderedList>
          </GridItem>
          <GridItem>
            <Box color="grey.425" fontSize={12} mt={6}>
              Sauf mention contraire, tous les contenus de ce site sont sous licence{" "}
              <Link
                href="https://www.etalab.gouv.fr/licence-version-2-0-de-la-licence-ouverte-suite-a-la-consultation-et-presentation-du-decret"
                aria-label="Accès au site Etalab - nouvelle fenêtre"
                textDecoration="underline"
                isExternal
                mr={4}
              >
                etalab-2.0 <ExternalLinkIcon mx="2px" />
              </Link>
            </Box>
            <Box color="grey.425" fontSize={12} mt={6} pb={12}>
              v.{publicConfig.version} © République française {new Date().getFullYear()}
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}

export default Footer
