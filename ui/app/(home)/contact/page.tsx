import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Metadata } from "next"

import { DsfrLink } from "../../../components/dsfr/DsfrLink"
import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../components/Breadcrumb"

export const metadata: Metadata = {
  title: PAGES.static.contact.getMetadata().title,
  description: PAGES.static.contact.getMetadata().description,
}

const Contact = () => (
  <Box>
    <Box as="main">
      <Breadcrumb pages={[PAGES.static.contact]} />
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
              <Button priority="secondary" aria-label="Accès à la Foire aux questions">
                <DsfrLink href="/faq">Consulter la FAQ</DsfrLink>
              </Button>
            </Box>
            <Text as="p" mb={4}>
              Si jamais vous ne trouvez pas votre réponse dans notre FAQ, ou souhaitez nous partager votre avis ou une suggestion d’amélioration sur nos outils, contactez nous par
              email à<br />
              <DsfrLink aria-label="Envoi d'un email au service candidat de La bonne alternance" href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Page%20Contact">
                labonnealternance@apprentissage.beta.gouv.fr
              </DsfrLink>
            </Text>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  </Box>
)

export default Contact
