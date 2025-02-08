import { Box, Container, Divider, Text, VStack } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Link from "next/link"

import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../components/Breadcrumb"

export default function MetiersRendererClient({ _, jobs }) {
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.metiers]} />

        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Text variant="editorialContentH1" as="h1">
            <Text as="span" color="black">
              Tous les emplois
            </Text>
            <br />
            et formations en alternance
          </Text>
          <Divider variant="pageTitleDivider" my={12} />

          <Box as="p">
            Vous voulez travailler en alternance ? Vous voulez obtenir un diplôme en alternance ? Toutes les informations pour trouver une alternance rapidement sont sur La bonne
            alternance :
          </Box>
          <VStack mt={2} align="flex-start">
            <Text>Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation</Text>
            <Text>Liste d’entreprises qui recrutent en alternance</Text>
            <Text>Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master</Text>

            {jobs.map((job, index) => {
              return (
                <Text key={index} marginTop="0px" mb={[2, 2, 2, 0]}>
                  <Text as="span">Emploi en alternance et formation en alternance en </Text>
                  <Link className={fr.cx("fr-link", "fr-text--bold")} href={`/metiers/${job.slug}`} aria-label={`Lancement d'une recherche sur le métier ${job.name}`}>
                    {job.name}
                  </Link>
                </Text>
              )
            })}
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
