import React from "react"
import Breadcrumb from "../components/breadcrumb"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

import Footer from "../components/footer"
import { Box, Container, Divider, Grid, GridItem, Link, Text } from "@chakra-ui/react"

const stats2 = () => (
  <Box>
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="stats" label="Statistiques" />

    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12, 12, 12, 5]}>
          <Box as="h1">
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              Statistiques
            </Text>
          </Box>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 7]}>
          <Text as="h2" mb="2" variant="homeEditorialH2">
            Statistiques
          </Text>
          <Text as="p" mb="3">
            La bonne alternance est une startup d’Etat incubée par beta.gouv. Nous développons un service à destination des publics selon les principes du{" "}
            <Link href="https://beta.gouv.fr/manifeste" aria-label="Accès au site de Beta gouv" isExternal variant="editorialContentLink">
              Manifeste de beta.gouv
            </Link>
          </Text>
          <Text as="p" mb="3">
            Nous mesurons l’impact de nos actions et publions en toute transparence nos statistiques que vous pouvez{" "}
            <Link
              href="https://datastudio.google.com/reporting/1v-Sim2qMlFSMn4n9JJWaMk8PIONvM757"
              aria-label="Accès aux statistiques du service"
              isExternal
              variant="editorialContentLink"
            >
              consulter ici
            </Link>
          </Text>
        </GridItem>
      </Grid>
    </Container>
    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Visitorat
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_plausible"
          plausible-embed
          src="https://plausible.io/share/labonnealternance.apprentissage.beta.gouv.fr?auth=Ck7r5NwNNf9IveZVA5U0O&embed=true&theme=light&background=transparent"
          loading="lazy"
        ></iframe>
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Offres La bonne alternance
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_recueil_offres_lba"
          plausible-embed
          src="https://matcha.apprentissage.beta.gouv.fr/metabase/public/dashboard/44c21e1d-7a7a-4ddb-b02b-e6ed184bd930"
          loading="lazy"
        ></iframe>
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Formations présentant la prise de RDV
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_affichage_rdva_lba"
          plausible-embed
          src="https://rdv-cfa.apprentissage.beta.gouv.fr/metabase/public/dashboard/37610a2e-bc39-4803-80ae-03ca1c514f9a"
          loading="lazy"
        ></iframe>
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Candidatures aux offres La bonne alternance
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_candidatures_offres_lba"
          src="https://labonnealternance.apprentissage.beta.gouv.fr/metabase/public/dashboard/9b0132ca-2629-4fa7-9be8-9183f2f7d98d"
          loading="lazy"
        />
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Demandes de RDV
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_demandes_rdva_lba"
          src="https://rdv-cfa.apprentissage.beta.gouv.fr/metabase/public/dashboard/2db04ee6-6bd3-41e7-9b74-12b43bd4b4b7"
          loading="lazy"
        />
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Taux de réponse aux candidatures (offres La bonne alternance, offres Pôle emploi et candidatures spontanées)
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_taux_reponse_candidatures"
          src="https://labonnealternance.apprentissage.beta.gouv.fr/metabase/public/dashboard/7f66e10d-0f1a-4839-b905-09aac03750dc"
          loading="lazy"
        />
      </Box>
      <Box mb={8}>
        <Text mb={8} fontWeight={700} as="h3">
          Taux de réponse aux demandes de RDV
        </Text>
        <iframe
          width="100%"
          border="none"
          height="800px"
          title="stats_taux_reponse_rdva"
          src="https://rdv-cfa.apprentissage.beta.gouv.fr/metabase/public/dashboard/63db63a5-26a2-4db7-8f26-f33dc6ce4491"
          loading="lazy"
        />
      </Box>
    </Container>
    <Footer />
  </Box>
)

export default stats2
