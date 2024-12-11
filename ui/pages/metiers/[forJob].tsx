import fs from "fs"
import path from "path"

import { Box, Container, Divider, Link, Text, VStack } from "@chakra-ui/react"
import { find, sortBy } from "lodash"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"

import Breadcrumb from "../../components/breadcrumb"
import Footer from "../../components/footer"
import Navigation from "../../components/navigation"
import { buildLinkForTownAndJob } from "../../utils/buildLinkForTownAndJob"
import { getStaticMetiers, getStaticVilles } from "../../utils/getStaticData"

export default function ForJob(props) {
  const router = useRouter()

  const currentSlug = router.query.forJob
  const currentJob = find(props.dataJobs, (e) => e.slug === currentSlug)
  const sortedTowns = sortBy(props.dataTowns, (e) => e.slug)

  const navigationItems = [
    { title: "Métiers", path: "metiers" },
    { title: currentJob.name, path: `metiers/${currentSlug}` },
  ]

  return (
    <Box>
      <NextSeo
        title={`Tous les emplois et formations en alternance en ${currentJob.name} | La bonne alternance | Trouvez votre alternance`}
        description={`Villes où chercher des emplois et formations en alternance pour le métier ${currentJob.name}`}
      />
      <Navigation />

      <Box as="main">
        <Breadcrumb items={navigationItems} />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Text variant="editorialContentH1" as="h1">
            <Text as="span" color="black">
              Tous les emplois et formations
            </Text>
            <br />
            en alternance en <i>{currentJob.name}</i>
          </Text>
          <Divider variant="pageTitleDivider" my={12} />

          <Box as="p">Vous êtes à seulement 2 clics d&apos;obtenir toutes les informations pour trouver une alternance rapidement sur La bonne alternance :</Box>
          <VStack mt={2} align="flex-start">
            <Text>
              Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation en <i>{currentJob.name}</i>
            </Text>
            <Text>
              Liste d’entreprises qui recrutent en alternance en <i>{currentJob.name}</i>
            </Text>
            <Text>
              Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master en <i>{currentJob.name}</i>
            </Text>

            <Text marginTop="0px" mb={[2, 2, 2, 0]}>
              <Text as="span">Emploi en alternance et formation en alternance en </Text>

              <NextLink legacyBehavior href={buildLinkForTownAndJob({ name: "France" }, currentJob)} passHref>
                <Link
                  title={`Voir les emplois en alternance et formation en alternance en ${currentJob.name} sur l'ensemble du territoire`}
                  textDecoration="underline"
                  fontWeight={700}
                >
                  {currentJob.name} sur l'ensemble du territoire
                </Link>
              </NextLink>
            </Text>

            {sortedTowns.map((currentTown, index) => {
              return (
                <Text key={index} marginTop="0px" mb={[2, 2, 2, 0]}>
                  <Text as="span">Emploi en alternance et formation en alternance en </Text>
                  <NextLink legacyBehavior href={buildLinkForTownAndJob(currentTown, currentJob)} passHref>
                    <Link
                      title={`Voir les emplois en alternance et formation en alternance en ${currentJob.name} à ${currentTown.name}`}
                      textDecoration="underline"
                      fontWeight={700}
                    >
                      {currentJob.name} à {currentTown.name}
                    </Link>
                  </NextLink>
                </Text>
              )
            })}
          </VStack>
        </Container>
      </Box>
      <Footer />
    </Box>
  )
}

// Required.
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export async function getStaticPaths() {
  const txtDirectory = path.join(process.cwd(), "config")

  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  const mapped_pathes = dataJobs.map((e) => {
    return { params: { forJob: e.slug } }
  })

  return {
    paths: mapped_pathes,
    fallback: false,
  }
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const txtDirectory = path.join(process.cwd(), "config")

  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  return {
    props: {
      dataTowns: dataTowns,
      dataJobs: dataJobs,
    },
  }
}
