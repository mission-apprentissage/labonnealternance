import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider, Grid, List, ListItem, Typography } from "@mui/material"

import Image from "next/image"
import Card from "@codegouvfr/react-dsfr/Card"
import type { Metadata } from "next"
import { ARTICLES } from "./const"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { AllerPlusLoinItem } from "@/app/(editorial)/_components/AllerPlusLoinItem"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { DsfrIcon } from "@/components/DsfrIcon"
import { GuideHeaderIllustration } from "@/app/(editorial)/_components/GuideHeaderIllustration"
import { DocumentGridItem } from "@/app/(editorial)/_components/DocumentGridItem"

export const metadata: Metadata = PAGES.static.guideCFA.getMetadata()

const GuideCFAPage = () => {
  return (
    <Box
      sx={{
        mb: fr.spacing("6v"),
      }}
    >
      <Breadcrumb pages={[PAGES.static.guideCFA]} />
      <DefaultContainer>
        <Box display={{ md: "flex", xs: "none" }}>
          <GuideHeaderIllustration />
        </Box>
        <Box my={{ md: fr.spacing("4v") }}>
          <Grid container spacing={fr.spacing("8v")} p={{ md: fr.spacing("6v") }} sx={{ position: "relative", zIndex: 2 }}>
            <Grid size={{ md: 7, xs: 12 }} gap={fr.spacing("4v")} display={"flex"} flexDirection={"column"}>
              <Typography component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }} gutterBottom>
                Ressources CFA
              </Typography>
              <Typography component={"p"} variant="body1" display={{ md: "block", xs: "none" }}>
                La bonne alternance vous propose un ensemble d’informations et d’outils pour soutenir vos démarches d’accompagnement auprès des jeunes et de vos entreprises
                partenaires.
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Grid container spacing={fr.spacing("4v")}>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              Tout savoir sur l'alternance
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Grid
            container
            size={12}
            sx={{
              "& .fr-card__content": {
                padding: fr.spacing("6v"),
              },
              "& .fr-card__end": {
                display: "none",
                padding: 0,
              },
            }}
          >
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["decouvrir-l-alternance"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["apprentissage-et-handicap"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["la-carte-etudiant-des-metiers"]} />
            </Grid>
          </Grid>
          <Grid container size={12} spacing={fr.spacing("4v")}>
            <Grid size={12} my={fr.spacing("6v")}>
              <Typography component="h2" variant="h2">
                Liens utiles
              </Typography>
              <Divider
                sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
              />
            </Grid>
            <Grid size={12} mx={{ md: fr.spacing("8v"), xs: fr.spacing("2v") }}>
              <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense>
                <ListItem sx={{ display: "list-item" }}>
                  Pour rechercher une formation en alternance, le{" "}
                  <DsfrLink href="https://catalogue-apprentissage.intercariforef.org/" aria-label="Consulter le Catalogue des offres de formations en apprentissage">
                    Catalogue des offres de formations en apprentissage
                  </DsfrLink>{" "}
                  du Réseau des Carif-Oref centralise nationalement l'ensemble des offres de formation en apprentissage collectées régionalement par les Carif-Oref.
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Le{" "}
                  <DsfrLink href="https://travail-emploi.gouv.fr/precis-de-lapprentissage" aria-label="Consulter le Précis de l’apprentissage">
                    Précis de l’apprentissage
                  </DsfrLink>{" "}
                  vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond
                  à l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases
                  documentaires et méthodologiques communes.
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Le{" "}
                  <DsfrLink href="https://www.cfadock.fr/doc/Vade-mecum%20CFA.pdf" aria-label="Consulter le Vade-mecum CFA">
                    Vade-mecum CFA
                  </DsfrLink>{" "}
                  précise les modalités pratiques de gestion des contrats d’apprentissage. Il concerne la gestion et le financement des contrats d’apprentissage conclus dans le
                  secteur privé et a été élaboré en concertation avec les têtes de réseau des Centres de Formation pour Apprentis (CFA) et la Direction Générale Emploi et Formation
                  Professionnelle (DGEFP).
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Retrouvez les fiches juridiques et les actualités de la formation professionnelle sur le site{" "}
                  <DsfrLink href="https://www.centre-inffo.fr/" aria-label="Consulter le site Centre Inffo">
                    Centre Inffo
                  </DsfrLink>
                  , association sous tutelle du ministère en charge de la Formation professionnelle.
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  <DsfrLink href="https://www.francecompetences.fr/" aria-label="Consulter le site France Compétences">
                    France Compétences
                  </DsfrLink>{" "}
                  est l’autorité nationale chargée du financement et de la régulation de la formation professionnelle de l’apprentissage.
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Pour découvrir les bonnes pratiques d’une formation en apprentissage pour les établissements d’enseignement supérieur, consultez la{" "}
                  <DsfrLink
                    href="https://www.enseignementsup-recherche.gouv.fr/fr/charte-pour-un-accompagnement-responsable-et-de-qualite-des-apprentis-des-etablissements-d-93051"
                    aria-label="Consulter la Charte pour un accompagnement responsable et de qualité des apprentis"
                  >
                    Charte pour un accompagnement responsable et de qualité des apprentis
                  </DsfrLink>
                  .
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  De façon globale, le site référence pour suivre l’actualité et la réglementation sur l’alternance est celui du{" "}
                  <DsfrLink href="https://travail-emploi.gouv.fr/" aria-label="Consulter le site du Ministère du Travail">
                    Ministère du Travail
                  </DsfrLink>
                  .
                </ListItem>
              </List>
            </Grid>
            <Grid
              container
              size={12}
              sx={{
                backgroundColor: fr.colors.decisions.background.default.grey.hover,
                borderRadius: fr.spacing("2v"),
                padding: { md: fr.spacing("8v"), xs: fr.spacing("4v") },
                marginTop: fr.spacing("8v"),
              }}
              spacing={2}
            >
              <Grid size={12} my={fr.spacing("6v")}>
                <Typography component="h2" variant="h2">
                  Documents utiles
                </Typography>
                <Divider
                  sx={{
                    width: fr.spacing("16v"),
                    height: 0,
                    background: "none",
                    borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}`,
                  }}
                />
              </Grid>
              <DocumentGridItem
                title="Guide apprentissage et handicap"
                link="https://travail-emploi.gouv.fr/apprentissage-et-handicap-un-guide-pour-les-employeurs-et-les-apprentis"
              />
              <DocumentGridItem
                title="Guide sur les aides aux contrats en alternance"
                link="https://travail-emploi.gouv.fr/aides-aux-contrats-en-alternance-guide-pratique-destination-des-employeurs-et-des-organismes-de-formation"
              />
              <DocumentGridItem title="CERFA Apprentissage" link="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319" />
              <DocumentGridItem title="CERFA Professionnalisation" link="https://www.service-public.gouv.fr/particuliers/vosdroits/R10338" />
              <DocumentGridItem
                title="Convention de réduction ou d’allongement de la durée du contrat d’apprentissage"
                link="https://www.legifrance.gouv.fr/download/pdf?id=RXAkPiH46HPlfBr9nv5wqIvKSk5AJ5_K4MfKeTuWgLs="
              />
            </Grid>
          </Grid>
          <Grid size={12} my={fr.spacing("6v")}>
            <Typography component="h2" variant="h2">
              Encore plus de ressources
            </Typography>
            <Divider
              sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
            />
          </Grid>
          <Grid container size={12}>
            <Grid size={{ md: 6, xs: 12 }}>
              <Card
                title="Ressources alternant"
                desc="Toutes les informations et ressources utiles pour bien accompagner vos alternants."
                linkProps={{
                  href: PAGES.static.guideAlternant.getPath(),
                }}
                enlargeLink
                shadow
                style={{ height: "100%" }}
              />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Card
                title="Ressources recruteur"
                desc="Toutes les informations et ressources utiles pour les employeurs embauchant des apprentis."
                linkProps={{
                  href: PAGES.static.guideRecruteur.getPath(),
                }}
                enlargeLink
                shadow
                style={{ height: "100%" }}
              />
            </Grid>
          </Grid>
          <Grid container size={12} sx={{ px: fr.spacing("6v"), py: fr.spacing("4v") }}>
            <Grid size={{ md: 3, xs: 12 }}>
              <Image src="/images/guides/guide-cfa/recruteur.svg" width={200} height={120} alt="" aria-hidden={true} />
            </Grid>
            <Grid size={{ md: 9, xs: 12 }} sx={{ display: "flex", alignItems: "center" }}>
              <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")} my={fr.spacing("4v")}>
                <Typography variant="body1" fontWeight={500}>
                  Diffusez simplement et gratuitement les offres en alternance de vos partenaires
                </Typography>
                <Box>
                  <DsfrLink href={PAGES.static.home.getPath()} aria-label="Consulter le site La bonne alternance">
                    Accéder à la page d'accueil
                    <DsfrIcon name="fr-icon-arrow-right-line" size={16} ml={fr.spacing("2v")} marginRight={"0 !important"} />
                  </DsfrLink>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Grid container size={12} sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover, px: fr.spacing("6v"), py: fr.spacing("4v") }}>
            <Grid size={{ md: 10, xs: 12 }}>
              <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")} my={fr.spacing("4v")}>
                <Typography variant="body1" fontWeight={500}>
                  Vous avez une question sur le fonctionnement de notre plateforme ?
                </Typography>
                <Box>
                  <DsfrLink href={PAGES.static.faq.getPath()} aria-label="Consulter la foire aux questions">
                    Consulter la FAQ
                    <DsfrIcon name="fr-icon-arrow-right-line" size={16} ml={fr.spacing("2v")} marginRight={"0 !important"} />
                  </DsfrLink>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ md: 2, xs: 12 }}>
              <Image src="/images/guides/faq.svg" width={200} height={110} alt="" aria-hidden={true} />
            </Grid>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}

export default GuideCFAPage
