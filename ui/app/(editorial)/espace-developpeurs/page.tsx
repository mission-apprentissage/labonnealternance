import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.EspaceDeveloppeurs.getMetadata().title,
  description: PAGES.static.EspaceDeveloppeurs.getMetadata().description,
}

export default function EspaceDeveloppeurs() {
  return (
    <Box mb={fr.spacing("3w")}>
      <Breadcrumb pages={[PAGES.static.EspaceDeveloppeurs]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={fr.spacing("3w")}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: 2, color: fr.colors.decisions.text.default.info.default }}>
                Espace développeurs
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography mb={fr.spacing("2w")}>
                La bonne alternance propose un point d’entrée unique et documenté pour faciliter l’accès à toutes les données relatives à l’apprentissage.
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                L’espace développeur est un site dédié{" "}
                <DsfrLink aria-label="Accès au site api.apprentissage - nouvelle fenêtre" href="https://api.apprentissage.beta.gouv.fr">
                  API Apprentissage
                </DsfrLink>{" "}
                , sur lequel vous pourrez utiliser les différents jeux de données proposés, une fois votre compte créé :
              </Typography>

              <Grid mb={fr.spacing("12v")} display="flex" justifyContent="center" gap={4}>
                <Button priority="secondary" size="large">
                  <DsfrLink href="https://api.apprentissage.beta.gouv.fr/fr/explorer">Explorer l'API</DsfrLink>
                </Button>
                <Button priority="secondary" size="large">
                  <DsfrLink href="https://api.apprentissage.beta.gouv.fr/fr/documentation-technique">Voir la documentation technique</DsfrLink>
                </Button>
              </Grid>
              <Typography variant="h4" mb={fr.spacing("2w")}>
                Obtenir des données
              </Typography>
              <Typography mb={fr.spacing("2w")} fontWeight={700}>
                API
              </Typography>
              <Typography mb={fr.spacing("2w")}>
                Les opportunités d'emplois et de formation exposées sur le site La bonne alternance sont accessibles à tous via notre API.
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Utilisée dans sa globalité cette API permet la mise en relation des candidats à l’alternance avec des entreprises accueillant des alternants d’une part et/ou avec
                des organismes de formation en alternance d’autre part.
              </Typography>

              <Typography mb={fr.spacing("2w")}>Documentation des différentes routes API</Typography>

              <Box
                component="ul"
                sx={{
                  mb: 4,
                  pl: 2,
                  listStyle: "disc",
                  "& > li": {
                    mb: 1.5, // ou `mb: 2` si tu veux plus d'espacement
                  },
                }}
              >
                <li>
                  Recherche d'opportunités d'emploi en alternance :{" "}
                  <DsfrLink aria-label="Accès au site api.apprentissage - nouvelle fenêtre" href="https://api.apprentissage.beta.gouv.fr/fr/explorer/recherche-offre">
                    https://api.apprentissage.beta.gouv.fr/fr/explorer/recherche-offre
                  </DsfrLink>
                </li>
                <li>Recherche d'opportunités de formation en alternance : à venir</li>
                <li>Envoi de candidatures à une opportunités d'emploi : à venir</li>
                <li>Envoi de prise de contact à une opportunité de formation : à venir</li>
              </Box>
              <Typography mb={fr.spacing("2w")} fontWeight={700}>
                Widget
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Pour une intégration rapide et simplifiée, les données présentées ci-dessus sont également disponibles sous forme de widget.
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Disponible en marque blanche ce widget est proposé en plusieurs tailles. Par ailleurs, différents filtres peuvent être appliqués aux données qu’il restitue.
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Pour exploiter le widget,{" "}
                <DsfrLink
                  aria-label="Exposez tout ou partie de l'offre de formation et d'emploi en alternance - nouvelle fenêtre"
                  href="https://api.gouv.fr/guides/widget-la-bonne-alternance"
                >
                  consultez cette documentation.
                </DsfrLink>
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Pour tester le widget,{" "}
                <DsfrLink aria-label="Testez le widget - nouvelle fenêtre" href="https://labonnealternance.apprentissage.beta.gouv.fr/test-widget">
                  consultez cette page.
                </DsfrLink>
              </Typography>

              <Typography variant="h4" mb={fr.spacing("2w")}>
                Envoyer des données
              </Typography>

              <Typography mb={fr.spacing("2w")} fontWeight={700}>
                API
              </Typography>

              <Typography mb={fr.spacing("2w")}>
                Par ailleurs, collectez et partagez les besoins en recrutement en alternance de vos entreprises, afin d’améliorer leur visibilité auprès des candidats à
                l’alternance via cette API :{" "}
                <DsfrLink aria-label="Dépôt d'offre" href="https://api.apprentissage.beta.gouv.fr/fr/explorer/depot-offre">
                  https://api.apprentissage.beta.gouv.fr/fr/explorer/depot-offre
                </DsfrLink>
              </Typography>
              <Typography mb={fr.spacing("2w")} fontWeight={700}>
                Widget
              </Typography>

              <Typography mb={fr.spacing("2w")}>Pour une intégration rapide et simplifiée, cette fonctionnalité est également disponible sous forme de widget.</Typography>

              <Typography mb={fr.spacing("2w")}>
                Pour exploiter le widget, utilisez l’adresse suivante au sein d’une balise HTML en remplaçant "ORIGINE" par le nom de votre établissement.
              </Typography>

              <Box
                component={"pre"}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  padding: 2,
                  borderRadius: 2,
                  overflowX: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {"<iframe loading=`lazy` src=`https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/widget/ORIGINE` width=`100%` height=`800` frameBorder=`0`></iframe>"}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
