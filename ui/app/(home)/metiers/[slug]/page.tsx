import fs from "fs"
import path from "path"

import { Box, Container, Divider, Text, VStack } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Metadata } from "next"
import Link from "next/link"

import { buildLinkForTownAndJob } from "../../../../utils/buildLinkForTownAndJob"
import { getStaticMetiers, getStaticVilles, IStaticMetiers } from "../../../../utils/getStaticData"
import { PAGES } from "../../../../utils/routes.utils"
import { Breadcrumb } from "../../../_components/Breadcrumb"

const getTowns = () => {
  const txtDirectory = path.join(process.cwd(), "config")
  const towns = getStaticVilles(path, fs, txtDirectory)
  return towns
}
const getMetiers = () => {
  const txtDirectory = path.join(process.cwd(), "config")
  const jobs = getStaticMetiers(path, fs, txtDirectory)
  return jobs
}

const getMetierBySlug = (jobs: IStaticMetiers[], slug: IStaticMetiers["slug"]) => {
  const relatedTown = jobs.find((town) => town.slug === slug)
  return relatedTown
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const _params = await params
  const metier = getMetierBySlug(getMetiers(), _params.slug)
  return {
    title: PAGES.dynamic.metierJobById(metier.name).getMetadata().title,
    description: PAGES.dynamic.metierJobById(metier.name).getMetadata().description,
  }
}

export default async function MetiersByJobId({ params }: { params: IStaticMetiers }) {
  const _params = await params
  const towns = getTowns()
  const metiers = getMetiers()
  const relatedMetier = getMetierBySlug(metiers, _params.slug)
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.metiers, PAGES.dynamic.metierJobById(relatedMetier.name)]} />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Text variant="editorialContentH1" as="h1">
            <Text as="span" color="black">
              Tous les emplois et formations en alternance en
            </Text>
            <br />
            {relatedMetier.name}
          </Text>
          <Divider variant="pageTitleDivider" my={12} />

          <Box as="p">Vous êtes à seulement 2 clics d&apos;obtenir toutes les informations pour trouver une alternance rapidement sur La bonne alternance :</Box>
          <VStack spacing={1} align="flex-start">
            <Text>
              Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation en <i>{relatedMetier.name}</i>
            </Text>
            <Text>
              Liste d’entreprises qui recrutent en alternance en <i>{relatedMetier.name}</i>
            </Text>
            <Text>
              Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master en <i>{relatedMetier.name}</i>
            </Text>

            <Text marginTop="0px" mb={[2, 2, 2, 0]}>
              <Text as="span">Emploi en alternance et formation en alternance en </Text>

              <Link
                className={fr.cx("fr-link", "fr-text--bold")}
                href={buildLinkForTownAndJob({ name: "France" }, relatedMetier)}
                title={`Voir les emplois en alternance et formation en alternance en ${relatedMetier.name} sur l'ensemble du territoire`}
              >
                {relatedMetier.name} sur l'ensemble du territoire
              </Link>
            </Text>

            {towns.map((currentTown, index) => {
              return (
                <Text key={index} marginTop="0px" mb={[2, 2, 2, 0]}>
                  <Text as="span">Emploi en alternance et formation en alternance en </Text>
                  <Link
                    className={fr.cx("fr-link", "fr-text--bold")}
                    href={buildLinkForTownAndJob(currentTown, relatedMetier)}
                    title={`Voir les emplois en alternance et formation en alternance en ${relatedMetier.name} à ${currentTown.name}`}
                  >
                    {relatedMetier.name} à {currentTown.name}
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
