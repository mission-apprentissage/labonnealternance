import React from "react"
import { Box, Container, Heading, Link, Text } from "@chakra-ui/react"
import Layout from "../common/components/Layout"
import { Breadcrumb } from "../common/components/Breadcrumb"
import { setTitle } from "../common/utils/pageUtils"

/**
 * @description Homepage component.
 * @returns {JSX.Element}
 */
export default () => {
  const title = "Accueil"
  setTitle(title)

  return (
    <Layout>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]} color="#1E1E1E">
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: title }]} />
        </Container>
      </Box>
      <Box w="100%" py={[4, 8]} px={[1, 1, 12, 24]} color="#1E1E1E">
        <Container maxW="xl">
          <Heading as="h1" fontSize="lg">
            Le service Rendez-vous apprentissage, un nouvel outil de sourcing pour les organismes de formation.
          </Heading>
          <Box pt={4} pb={16} mt={8}>
            <Text>
              « RDV Apprentissage » est un service créé par la Mission Nationale de l’apprentissage dans le but de faciliter la mise en relation entre les candidats et les centres
              de formation en apprentissage (CFA). Grâce à un simple bouton présent sur les plateformes exposant les formations en apprentissage sur internet, les candidats peuvent
              demander aux CFA qui les intéressent de les recontacter par téléphone ou par mail.
              <br />
              <br />
              En facilitant cette première prise de contact, le service vise à fluidifier et à sécuriser le parcours des candidats à l’apprentissage. Il a pour première cible les
              jeunes intéressés par l’apprentissage mais qui, aujourd’hui, ne prennent pas contact avec les CFA de manière systématique et immédiate.
              <br />
              Le service est ouvert à tous les CFA référencés au niveau du{" "}
              <Link href={"https://catalogue.apprentissage.beta.gouv.fr"} textDecoration={"underline"} isExternal>
                Catalogue des formations
              </Link>
              . Pour être référencé dans le Catalogue, merci de vous rapprocher de votre Carif-oref. Le service est disponible depuis janvier 2021.
              <br />
              <br />
            </Text>
          </Box>
        </Container>
      </Box>
    </Layout>
  )
}
