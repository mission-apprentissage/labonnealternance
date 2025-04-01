import { Box, Code, Container, Divider, Grid, GridItem, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.EspaceDeveloppeurs.getMetadata().title,
  description: PAGES.static.EspaceDeveloppeurs.getMetadata().description,
}

export default function EspaceDeveloppeurs() {
  return (
    <Box>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.EspaceDeveloppeurs]} />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Grid templateColumns="repeat(12, 1fr)">
            <GridItem px={4} colSpan={[12, 12, 12, 5]}>
              <Text variant="editorialContentH1" as="h1">
                Espace développeurs
              </Text>
              <Divider variant="pageTitleDivider" my={12} />
            </GridItem>
            <GridItem px={4} colSpan={[12, 12, 12, 7]}>
              <Text as="p" mt={4} mb={4}>
                La bonne alternance propose un point d’entrée unique et documenté pour faciliter l’accès à toutes les données relatives à l’apprentissage.
              </Text>
              <Text as="p" mt={4} mb={4}>
                L’espace développeur est un site dédié{" "}
                <DsfrLink aria-label="Accès au site api.apprentissage - nouvelle fenêtre" href="https://api.apprentissage.beta.gouv.fr">
                  API Apprentissage
                </DsfrLink>{" "}
                , sur lequel vous pourrez utiliser les différents jeux de données proposés, une fois votre compte créé :
              </Text>

              <Grid mb={fr.spacing("12v")} templateColumns="repeat(12, 1fr)" display="flex" justifyContent="center" gap={4}>
                <Button priority="secondary" size="large">
                  <DsfrLink href="https://api.apprentissage.beta.gouv.fr/fr/explorer">Explorer l'API</DsfrLink>
                </Button>
                <Button priority="secondary" size="large">
                  <DsfrLink href="https://api.apprentissage.beta.gouv.fr/fr/documentation-technique">Voir la documentation technique</DsfrLink>
                </Button>
              </Grid>
              <Text variant="editorialContentH2" as="h2" fontWeight={900}>
                Obtenir des données
              </Text>
              <Text as="span" fontWeight={900}>
                API
              </Text>
              <Text as="p" mb={4}>
                Les opportunités d'emplois et de formation exposées sur le site La bonne alternance sont accessibles à tous via notre API.
              </Text>
              <Text as="p" mt={4} mb={4}>
                Utilisée dans sa globalité cette API permet la mise en relation des candidats à l’alternance avec des entreprises accueillant des alternants d’une part et/ou avec
                des organismes de formation en alternance d’autre part.
              </Text>
              <Text as="p" mt={4} mb={4}>
                Documentation des différentes routes API
              </Text>
              <UnorderedList mb={4}>
                <ListItem>
                  Recherche d'opportunités d'emploi en alternance :{" "}
                  <DsfrLink aria-label="Accès au site api.apprentissage - nouvelle fenêtre" href="https://api.apprentissage.beta.gouv.fr/fr/explorer/recherche-offre">
                    https://api.apprentissage.beta.gouv.fr/fr/explorer/recherche-offre
                  </DsfrLink>
                </ListItem>
                <ListItem>Recherche d'opportunités de formation en alternance : à venir</ListItem>
                <ListItem>Envoi de candidatures à une opportunités d'emploi : à venir</ListItem>
                <ListItem>Envoi de prise de contact à une opportunité de formation : à venir</ListItem>
              </UnorderedList>
              <Text as="span" fontWeight={700}>
                Widget
              </Text>
              <Text as="p" mt={4} mb={4}>
                Pour une intégration rapide et simplifiée, les données présentées ci-dessus sont également disponibles sous forme de widget.
              </Text>
              <Text as="p" mt={4} mb={4}>
                Disponible en marque blanche ce widget est proposé en plusieurs tailles. Par ailleurs, différents filtres peuvent être appliqués aux données qu’il restitue.
              </Text>
              <Text as="p" mb={4}>
                Pour exploiter le widget,{" "}
                <DsfrLink
                  aria-label="Exposez tout ou partie de l'offre de formation et d'emploi en alternance - nouvelle fenêtre"
                  href="https://api.gouv.fr/guides/widget-la-bonne-alternance"
                >
                  consultez cette documentation.
                </DsfrLink>
              </Text>
              <Text as="p" mb={4}>
                Pour tester le widget,{" "}
                <DsfrLink aria-label="Testez le widget - nouvelle fenêtre" href="https://labonnealternance.apprentissage.beta.gouv.fr/test-widget">
                  consultez cette page.
                </DsfrLink>
              </Text>
              <Text variant="editorialContentH2" as="h2">
                Envoyer des données
              </Text>
              <Text as="span" fontWeight={700}>
                API
              </Text>
              <Text as="p" mb={4}>
                Par ailleurs, collectez et partagez les besoins en recrutement en alternance de vos entreprises, afin d’améliorer leur visibilité auprès des candidats à
                l’alternance via cette API :{" "}
                <DsfrLink aria-label="Dépôt d'offre" href="https://api.apprentissage.beta.gouv.fr/fr/explorer/depot-offre">
                  https://api.apprentissage.beta.gouv.fr/fr/explorer/depot-offre
                </DsfrLink>
              </Text>
              <Text as="span" fontWeight={700}>
                Widget
              </Text>
              <Text as="p" mb={4}>
                Pour une intégration rapide et simplifiée, cette fonctionnalité est également disponible sous forme de widget.
              </Text>
              <Text as="p" mb={4}>
                Pour exploiter le widget, utilisez l’adresse suivante au sein d’une balise HTML en remplaçant "ORIGINE" par le nom de votre établissement.
              </Text>
              <Code>
                {"<iframe loading=`lazy` src=`https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/widget/ORIGINE` width=`100%` height=`800` frameBorder=`0`></iframe>"}
              </Code>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
