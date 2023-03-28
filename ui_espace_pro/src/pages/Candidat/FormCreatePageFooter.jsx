import { Grid, GridItem, Box, Flex, Image, Link, Text } from "@chakra-ui/react"

export const FormCreatePageFooter = (props) => {
  return (
    <>
      <Box as="nav" pl={{ base: 8, lg: 0 }} mt="12" borderTop="2px solid #3A55D1">
        <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}>
          <GridItem colSpan={{ base: 1, lg: 1 }}>
            <Image src="/images/marianne.svg#svgView(viewBox(12 0 162 78))" alt="" width="290" height="130" />
          </GridItem>
          <GridItem colSpan={{ base: 1, lg: 1 }}>
            <Box pl={{ base: 0, lg: 2 }} height="100%" display="flex" alignItems="center">
              <Image src="/images/logo_LBA_u2.svg" alt="" width="135" height="35" />
            </Box>
          </GridItem>
          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Box pl={{ base: 0, lg: 4 }} mt={{ base: 8, lg: 0 }} height="100%" display="flex" alignItems="center">
              <Box fontSize="12px" color="#161616" pl="5">
                <Text as="strong">Le service de prise de rendez-vous</Text> proposé par{" "}
                <Link href="https://labonnealternance.apprentissage.beta.gouv.fr/" aria-label="Accès au site labonnealternance" isExternal textDecoration="underline">
                  La bonne alternance
                </Link>
                . Il est développé par la{" "}
                <Link href="https://mission-apprentissage.gitbook.io/general/" aria-label="Lien vers la mission interministérielle" isExternal textDecoration="underline">
                  Mission interministérielle pour l'apprentissage
                </Link>
                .
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </>
  )
}
