import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Grid, GridItem, Box, Image, Link, Text, UnorderedList, ListItem } from "@chakra-ui/react"

export const FormCreatePageFooter = () => {
  return (
    <>
      <Box as="nav" pl={{ base: 8, lg: 0 }} mt="12" borderTop="2px solid #3A55D1">
        <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }} mb={{ base: 8, lg: 0 }} px={{ base: 0, lg: 10 }}>
          <GridItem colSpan={{ base: 1, lg: 1 }}>
            <Image src="/images/marianne.svg#svgView(viewBox(12 0 162 78))" alt="" width="290" height="130" />
          </GridItem>
          <GridItem colSpan={{ base: 1, lg: 1 }}>
            <Box pl={{ base: 0, lg: 2 }} height="100%" display="flex" alignItems="center">
              <Image src="/images/logo_LBA.svg" alt="" width="135px" maxWidth="135px" />
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Box pl={{ base: 0, lg: 4 }} mt={{ base: 8, lg: 0 }} height="100%" display="flex" alignItems={{ base: "start", lg: "center" }}>
              <Box fontSize="12px" color="#161616" pl={{ base: 0, lg: 5 }}>
                <Text as="strong">Le service de prise de rendez-vous</Text> est proposé par{" "}
                <Link
                  href="https://labonnealternance.apprentissage.beta.gouv.fr/"
                  aria-label="Accès au site labonnealternance - nouvelle fenêtre"
                  isExternal
                  textDecoration="underline"
                >
                  La bonne alternance <ExternalLinkIcon mx="2px" />
                </Link>
                . Il est développé par la{" "}
                <Link
                  href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html"
                  aria-label="Lien vers la mission interministérielle - nouvelle fenêtre"
                  isExternal
                  textDecoration="underline"
                >
                  Mission interministérielle pour l'apprentissage <ExternalLinkIcon mx="2px" />
                </Link>
                .
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Box>
      <Box mx="auto">
        <Box as="nav">
          <Grid>
            <GridItem borderTop="1px solid #E5E5E5">
              <UnorderedList pt={{ base: 3, lg: 5 }} px={{ base: 8, lg: 10 }} listStyleType="none" color="grey.425" fontSize={12} marginInlineStart={0}>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 1 }}
                >
                  <Link href={`/mentions-legales`}>Mentions légales</Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 1 }}
                  paddingLeft={{ base: 0, lg: 1 }}
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
                  paddingRight={{ base: 0, lg: 1 }}
                  paddingLeft={{ base: 0, lg: 1 }}
                >
                  <Link href="/politique-de-confidentialite" aria-label="Accès à la page Politique de confidentialité">
                    Politique de confidentialité
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 1 }}
                  paddingLeft={{ base: 0, lg: 1 }}
                >
                  <Link href={`/faq`} aria-label="Accès à la foire aux questions">
                    FAQ
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRight={{ base: "none", lg: "1px solid" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 1 }}
                  paddingLeft={{ base: 0, lg: 1 }}
                >
                  <Link href="/contact" aria-label="Accès à la page Contact">
                    Contact
                  </Link>
                </ListItem>
                <ListItem
                  mt={{ base: 3, lg: 0 }}
                  display={{ base: "inherit", lg: "inline-block" }}
                  borderRightColor={{ base: "none", lg: "grey.300" }}
                  paddingRight={{ base: 0, lg: 0 }}
                  paddingLeft={{ base: 0, lg: 1 }}
                >
                  Accessibilité : non conforme
                </ListItem>
              </UnorderedList>
            </GridItem>
            <GridItem>
              <Box color="grey.425" fontSize={12} mt={6} pb={12} pl={{ base: 8, lg: 10 }}>
                Sauf mention contraire, tous les contenus de ce site sont sous licence{" "}
                <Link
                  href="https://www.etalab.gouv.fr/licence-version-2-0-de-la-licence-ouverte-suite-a-la-consultation-et-presentation-du-decret"
                  aria-label="Accès au site Etalab - nouvelle fenêtre"
                  textDecoration="underline"
                  isExternal
                >
                  etalab-2.0 <ExternalLinkIcon mx="2px" />
                </Link>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </>
  )
}
