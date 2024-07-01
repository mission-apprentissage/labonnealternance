import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, Image, Link, Text } from "@chakra-ui/react"
import React from "react"

import { DisplayContext } from "@/context/DisplayContextProvider"

const buildFtUrl = (formValues) => {
  let ftUrl = "https://candidat.francetravail.fr/offres/recherche?typeContrat=CDI,CDD&offresPartenaires=true&tri=0"
  if (formValues?.job) {
    ftUrl += `&motsCles=${formValues.job.romes}`
  }
  if (formValues?.location?.insee) {
    ftUrl += `&lieux=${formValues.location.insee}&rayon=${formValues.radius}`
  }

  return ftUrl
}

const RechercheCDICDD = () => {
  const { formValues } = React.useContext(DisplayContext)
  return (
    (formValues?.job || formValues?.location) && (
      <Box textAlign="center" px="72px" py="24px" margin="auto" m={["0.5rem 0", "18px 25px", "0.5rem 0", "0.5rem 25px"]} backgroundColor="#f5f5fe">
        <Flex>
          <Box textAlign="left">
            <Text mb={4}>Les opportunités sur notre site se limitent à des contrats en alternance mais ne vous arrêtez pas là. </Text>
            <Text mb={4} fontWeight={700}>
              Certaines entreprises proposent d’autres types de contrats, soumettez-leur l'idée de vous recruter en alternance.
            </Text>
            <Link ml="2px" isExternal variant="basicUnderlined" data-tracking-id="elargir-recherche-cdi-cdd-ft" href={buildFtUrl(formValues)}>
              Voir les offres France Travail <ExternalLinkIcon mb="3px" ml="2px" />
            </Link>
          </Box>
          <Image display={{ base: "none", md: "block" }} src="/images/recherche_cdd_cdi.svg" aria-hidden="true" alt="" />
        </Flex>
      </Box>
    )
  )
}

export default RechercheCDICDD
