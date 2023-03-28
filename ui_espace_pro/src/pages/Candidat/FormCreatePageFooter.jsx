import { Grid, GridItem, Box, Flex, Image, Link } from "@chakra-ui/react"

export const FormCreatePageFooter = (props) => {
  return (
    <>
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
    </>
  )
}
