import { Box, Button, Container, Divider, Grid, GridItem, Link, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { NextSeo } from "next-seo"
import React from "react"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop/index"

const Contact = () => (
  <Box>
    <NextSeo title="Contact | La bonne alternance | Trouvez votre alternance" description="Une remarque, un avis, une suggestion d’amélioration ? Contactez-nous !" />
    <ScrollToTop />
    <Navigation />
    <Box as="main">
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
            {/* @ts-expect-error: TODO */}
            <Box align="center" my={12}>
              <NextLink legacyBehavior href="/faq" passHref>
                <Button as="a" variant="primary" aria-label="Accès à la Foire aux questions">
                  Consulter la FAQ
                </Button>
              </NextLink>
            </Box>
            <Text as="p" mb={4}>
              Si jamais vous ne trouvez pas votre réponse dans notre FAQ, ou souhaitez nous partager votre avis ou une suggestion d’amélioration sur nos outils, contactez nous par
              email à<br />
              <Link
                aria-label="Envoi d'un email au service candidat de La bonne alternance"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact"
                variant="basicUnderlinedBlue"
              >
                labonnealternance@apprentissage.beta.gouv.fr
              </Link>
            </Text>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
    </Box>
    <Footer />
  </Box>
)

export default Contact
