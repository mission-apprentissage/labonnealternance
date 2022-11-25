import { Box, Button, Container, Divider, Text } from "@chakra-ui/react"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import React from "react"
import Breadcrumb from "../../../components/breadcrumb"
import Footer from "../../../components/footer"
import Navigation from "../../../components/navigation"
import { buildLinkForTownAndJob } from "../../../utils/buildLinkForTownAndJob"
import { getStaticMetiers, getStaticVilles } from "../../../utils/getStaticData"

export default function ForTown(props) {
  const router = useRouter()
  const find = require("lodash").find
  const currentTownSlug = router.query.forTown
  const currentJobSlug = router.query.forJob
  const currentJob = find(props.dataJobs, (e) => e.slug === currentJobSlug)
  const currentTown = find(props.dataTowns, (e) => e.slug === currentTownSlug)

  const navigationItems = [
    { title: "Métiers", path: "metiers" },
    { title: currentJob.name, path: `metiers/${currentJobSlug}` },
    { title: currentTown.name, path: `metiers/${currentJobSlug}/${currentTownSlug}` },
  ]

  return (
    <Box>
      <NextSeo
        title={`Tous les emplois et formations en alternance en ${currentJob.name} à ${currentTown.name} | La bonne alternance | Trouvez votre alternance`}
        description={`Chercher des emplois et formations en alternance pour le métier ${currentJob.name} dans la ville de ${currentTown.name}`}
      />
      <Navigation />
      <Breadcrumb items={navigationItems} />

      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Text variant="editorialContentH1" as="h1">
          <Text as="span" color="black">
            Tous les emplois et formations en alternance
          </Text>
          <br />
          en <i>{currentJob.name}</i> à {currentTown.name}
        </Text>
        <Divider variant="pageTitleDivider" my={12} />

        <Text mb={2} as="p">
          Vous voulez travailler en contrat d&apos;apprentissage ou en contrat de professionnalisation en <i>{currentJob.name}</i> à proximité de <i>{currentTown.name}</i> ?
        </Text>
        <Text mb={2} as="p">
          Vous voulez obtenir un diplôme en alternance en <i>{currentJob.name}</i> à proximité de <i>{currentTown.name}</i> ?
        </Text>
        <Text mb={2} as="p">
          Cliquez sur &quot;lancer cette recherche&quot; pour accéder aux résultats que La bonne alternance a trouvés pour vous !
        </Text>

        <Button variant="editorialPrimary" as="a" href={buildLinkForTownAndJob(currentTown, currentJob)} mt={4}>
          Lancer cette recherche
        </Button>
      </Container>
      <Footer />
    </Box>
  )
}

// Required.
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export async function getStaticPaths() {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataJobs = getStaticMetiers(path, fs, txtDirectory)
  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const flatten = require("lodash").flatten

  const mapped_pathes = flatten(
    dataJobs.map((job) => {
      return dataTowns.map((town) => {
        return {
          params: {
            forJob: job.slug,
            forTown: town.slug,
          },
        }
      })
    })
  )

  return {
    paths: mapped_pathes,
    fallback: false,
  }
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const path = require("path")
  const fs = require("fs")
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
