import NextLink from "next/link"
import React from "react"
import Breadcrumb from "../components/breadcrumb.js"
import Footer from "../components/footer.js"
import Navigation from "../components/navigation.js"
import ScrollToTop from "../components/ScrollToTop/index.js"

import { Box, Button, Container, Divider, Grid, GridItem, Link, Text } from "@chakra-ui/react"

import { NextSeo } from "next-seo"

const Contact = () => (
  <Box>
    <NextSeo title="Contact | La bonne alternance | Trouvez votre alternance" description="Une remarque, un avis, une suggestion d’amélioration ? Contactez-nous !" />
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="contact" label="Contact" />
    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12, 12, 12, 4]}>
          <Text variant="editorialContentH1" as="h1">
            Contact
          </Text>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 8]}>
          <Text variant="editorialContentH3" as="h3">
            Nous contacter
          </Text>
          <Text as="p">Vous avez une question sur nos outils ? Consultez notre foire aux questions. </Text>
          <Box align="center" my={12}>
            <NextLink href="/faq" passHref>
              <Button as="a" variant="editorialPrimary" aria-label="Accès à la Foire aux questions">
                Consulter la FAQ
              </Button>
            </NextLink>
          </Box>
          <Text as="p" mb={4}>
            Si jamais vous ne trouvez pas votre réponse dans notre FAQ, ou souhaitez nous partager votre avis ou une suggestion d’amélioration sur nos outils, contactez nous par
            email.
          </Text>
          <Text as="p" mb={4}>
            <Text as="span" fontWeight={700}>
              Vous êtes candidat,
            </Text>{" "}
            écrivez-nous en cliquant sur ce <br />
            <Link
              aria-label="Envoi d'un email au service candidat de La bonne alternance"
              href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Candidat"
            >
              lien vers notre adresse email labonnealternance@apprentissage.beta.gouv.fr
            </Link>
          </Text>
          <Text as="p" mb={4}>
            <Text as="span" fontWeight={700}>
              Vous êtes un organisme de formation,
            </Text>{" "}
            écrivez-nous en cliquant sur ce <br />
            <Link
              aria-label="Envoi d'un email au service organisme de formation de La bonne alternance"
              href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20OF"
            >
              lien vers notre adresse email labonnealternance@apprentissage.beta.gouv.fr
            </Link>
          </Text>
          <Text as="p" mb={4}>
            <Text as="span" fontWeight={700}>
              Vous êtes une entreprise recevant des candidatures spontanées,
            </Text>{" "}
            écrivez-nous en cliquant sur ce{" "}
            <Link
              aria-label="Envoi d'un email au service entreprise de La bonne alternance"
              href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Entreprise%20-%20Candidature%20spontanée"
            >
              lien vers notre adresse email labonnealternance@apprentissage.beta.gouv.fr
            </Link>
          </Text>
          <Text as="p" mb={4}>
            <Text as="span" fontWeight={700}>
              Vous êtes une entreprise intéressée par notre service de dépôt d&apos;offre simplifié,
            </Text>{" "}
            écrivez-nous en cliquant sur ce{" "}
            <Link
              aria-label="Envoi d'un email au service recruteur de La bonne alternance"
              href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact%20-%20Entreprise%20-%20Depot%20offre"
            >
              lien vers notre adresse email labonnealternance@apprentissage.beta.gouv.fr
            </Link>
          </Text>
        </GridItem>
      </Grid>
    </Container>
    <Box mb={3}>&nbsp;</Box>
    <Footer />
  </Box>
)

export default Contact
