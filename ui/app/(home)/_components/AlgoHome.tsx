import { Container, Divider, Grid, GridItem, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import Image from "next/image"

import TagCandidatureSpontanee from "../../../components/ItemDetail/TagCandidatureSpontanee"
import TagOffreEmploi from "../../../components/ItemDetail/TagOffreEmploi"

export const AlgoHome = () => (
  <Container variant="responsiveContainer">
    <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
      <GridItem colSpan={8} pr="8">
        <Text as="h2">
          <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
            Vous révéler{" "}
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
              <strong>Les offres d&apos;emploi</strong> : publiées sur notre plateforme ainsi que celles issues de France Travail et ses partenaires. Elles sont identifiées grâce
              au tag <TagOffreEmploi />
            </Text>
          </ListItem>
          <ListItem>
            <Text as="p" fontSize="18px" mb="5">
              <strong>Les candidatures spontanées</strong> : correspondant au marché caché de l&apos;emploi. Grâce à l'analyse de diverses données publiques (données de
              recrutement, données financières, etc.), La bonne alternance identifie chaque mois une liste restreinte d'entreprises à fort potentiel d'embauche en alternance, afin
              de faciliter les démarches de candidatures spontanées de ses utilisateurs. Elles sont identifiées grâce au tag <TagCandidatureSpontanee />
            </Text>
          </ListItem>
        </UnorderedList>
      </GridItem>
      <GridItem colSpan={4} display="flex" justifyContent="center" alignItems="center" pt="5">
        <Image src="/images/icons/algo_home.png" alt="" width={324} height={387} />
      </GridItem>
    </Grid>
  </Container>
)
