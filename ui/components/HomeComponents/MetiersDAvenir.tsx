import { ArrowForwardIcon, ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Container, Divider, Flex, Grid, GridItem, Link, SimpleGrid, Text } from "@chakra-ui/react"
import axios from "axios"
import NextLink from "next/link"
import React from "react"
import { useQuery } from "react-query"

import { publicConfig } from "@/config.public"

import { SendPlausibleEvent } from "../../utils/plausible"

const jobCssProperties = {
  background: "beige",
  borderRadius: "8px",
  border: "1.2px solid",
  borderColor: "bluefrance.200",
  cursor: "pointer",
  _focus: {
    background: "#E8EDFF",
    borderColor: "info",
    textDecoration: "none",
  },
  _hover: {
    background: "#E8EDFF",
    textDecoration: "none",
  },
}

const diagorienteLink = "https://diagoriente.gitbook.io/base-unifiee-competences-formations-metiers/presentation-generale/genese"

const buildJobBlock = ({ idx, title, rome }) => {
  const trackClick = () => {
    SendPlausibleEvent("Clic suggestion métier avenir - Page d'accueil", {
      metier: `${title} - ${rome}`,
    })
  }

  return (
    <NextLink legacyBehavior key={idx} passHref href={`/recherche?&display=list&job_name=${title}&romes=${rome}&radius=60`}>
      <Link onClick={trackClick} {...jobCssProperties} title={`Voir la liste des formations et opportunités d'emploi en alternance pour le métier d'avenir ${title}`}>
        <Flex minHeight="70px" maxHeight="80px" padding={8} alignItems="center" direction="row">
          <Text noOfLines={3} fontWeight={700} color="info">
            {title}
          </Text>
          <ArrowForwardIcon color="info" fontSize="20px" marginLeft="auto" />
        </Flex>
      </Link>
    </NextLink>
  )
}

const getMetiersDAvenir = async () => {
  const res = await axios.get(`${publicConfig.apiEndpoint}/metiersdavenir`)
  return res.data
}

const MetiersDAvenir = () => {
  const { isSuccess, data } = useQuery("metiers", getMetiersDAvenir)

  return (
    isSuccess && (
      <Container variant="responsiveContainer">
        <Text as="h2">
          <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
            Les métiers
          </Text>
          <Text as="span" display="block" mb={1} variant="editorialContentH1">
            qui recrutent
          </Text>
        </Text>
        <Divider variant="pageTitleDivider" my={[4, 4, 8]} />

        <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
          <GridItem colSpan={4} mr={[0, 0, 8, 8]} mb={[4, 4, 0, 0]}>
            <Box textAlign="center" height="100%" border="1px solid #E7E7E7" borderRadius="8px" py={12} px={8}>
              <Text as="p" lineHeight="32px" fontWeight={700} fontSize="24px" mb="5">
                Votre futur métier est peut-être parmi cette sélection !
              </Text>
              <Text textAlign="center" mb="5">
                Ces suggestions sont issues du service Diagoriente, qui oeuvre à l'orientation et l'insertion professionnelle.
              </Text>
              <Link variant="editorialContentLink" isExternal href={diagorienteLink} aria-label="Site de Diagoriente - nouvelle fenêtre">
                En savoir plus <ExternalLinkIcon mx="2px" />
              </Link>
            </Box>
          </GridItem>
          <GridItem colSpan={8} height="100%">
            <SimpleGrid columns={[1, 1, 1, 2]} spacingX={8} spacingY={4}>
              {data.suggestionsMetiersAvenir.map((metier, idx) => buildJobBlock({ idx, title: metier.title, rome: metier.codeROME }))}
            </SimpleGrid>
          </GridItem>
        </Grid>
      </Container>
    )
  )
}

export default MetiersDAvenir
