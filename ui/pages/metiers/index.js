import { Box, Container, Divider, Link, Text, VStack } from "@chakra-ui/react"
import React from "react"
import Breadcrumb from "../../components/breadcrumb"
import Footer from "../../components/footer"
import Navigation from "../../components/navigation"
import ScrollToTop from "../../components/ScrollToTop"

import { NextSeo } from "next-seo"
import { getStaticMetiers, getStaticVilles } from "utils/getStaticData"

export default function Catalog(props) {
  return (
    <Box>
      <NextSeo
        title={`Tous les emplois et formations en alternance | La bonne alternance | Trouvez votre alternance`}
        description={`Liste de métiers où trouver une formation ou un emploi en alternance`}
      />
      <ScrollToTop />
      <Navigation />
      <Breadcrumb forPage="metiers" label="Métiers" />

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

          {props.dataJobs.map((job, index) => {
            return (
              <Text key={index} marginTop="0px" mb={[2, 2, 2, 0]}>
                <Text as="span">Emploi en alternance et formation en alternance en </Text>
                <Link textDecoration="underline" fontWeight={700} href={`/metiers/${job.slug}`} aria-label={`Lancement d'une recherche sur le métier ${job.name}`}>
                  {job.name}
                </Link>
              </Text>
            )
          })}
        </VStack>
      </Container>

      <Footer />
    </Box>
  )
}

// See https://nextjs.org/learn/basics/data-fetching/with-data
// Static data, please restart nextjs each time this function change
export async function getStaticProps() {
  const path = require("path")
  const fs = require("fs")
  const txtDirectory = path.join(process.cwd(), "config")

  const dataTowns = getStaticVilles(path, fs, txtDirectory)
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  // The value of the `props` key will be
  //  passed to the `Catalog` component
  return {
    props: {
      dataJobs: dataJobs,
      dataTowns: dataTowns,
    },
  }
}
