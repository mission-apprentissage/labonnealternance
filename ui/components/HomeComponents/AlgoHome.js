import React from "react"
import TagCandidatureSpontanee from "../../components/ItemDetail/TagCandidatureSpontanee.js"
import TagOffreEmploi from "../../components/ItemDetail/TagOffreEmploi.js"
import { Image, Text, UnorderedList, ListItem, Divider, GridItem, Grid, Container } from "@chakra-ui/react"

const AlgoHome = () => {
  return (
    <Container variant="responsiveContainer">
      <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
        <GridItem colSpan="8" pr="8">
          <Text as="h2">
            <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
              Vous révéler
            </Text>
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              le marché caché de l&apos;emploi
            </Text>
          </Text>
          <Divider variant="pageTitleDivider" my={12} />
          <Text as="p" fontSize="18px" mb="5">
            La bonne alternance expose différents types d&apos;opportunités d&apos;emplois :
          </Text>
          <UnorderedList>
            <ListItem>
              <Text as="p" fontSize="18px" mb="5">
                <strong>Les offres d&apos;emploi</strong> : publiées sur notre plateforme ainsi que celles issues de Pôle emploi et ses partenaires. Elles sont identifiées grâce au
                tag <TagOffreEmploi />
              </Text>
            </ListItem>
            <ListItem>
              <Text as="p" fontSize="18px" mb="5">
                <strong>Les candidatures spontanées</strong> : correspondant au marché caché de l&apos;emploi. Chaque mois, un algorithme prédictif de Pôle emploi analyse les
                recrutements des 6 années passées pour prédire ceux des 6 mois à venir. Grâce à ces données, il identifie une liste restreinte d&apos;entreprises &quot;à fort
                potentiel d&apos;embauche en alternance&quot; pour faciliter vos démarches de candidatures spontanées. Elles sont identifiées grâce au tag{" "}
                <TagCandidatureSpontanee />
              </Text>
            </ListItem>
          </UnorderedList>
        </GridItem>
        <GridItem colSpan="4" display="flex" justifyContent="center" alignItems="center">
          <Image src="/images/icons/algo_home.svg" alt="" mt="5" />
        </GridItem>
      </Grid>
    </Container>
  )
}

export default AlgoHome
