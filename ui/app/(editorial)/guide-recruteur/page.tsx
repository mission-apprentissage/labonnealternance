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
import { QuizItem } from "@/app/(editorial)/_components/QuizItem"
import { DocumentGridItem } from "@/app/(editorial)/_components/DocumentGridItem"

export const metadata: Metadata = PAGES.static.guideRecruteur.getMetadata()

const GuideRecruteur = () => {
  return (
    <Box
      sx={{
        mb: fr.spacing("3w"),
      }}
    >
      <Breadcrumb pages={[PAGES.static.guideRecruteur]} />
      <DefaultContainer>
        <Box display={{ md: "flex", xs: "none" }}>
          <GuideHeaderIllustration />
        </Box>
        <Box my={{ md: fr.spacing("4v") }}>
          <Grid container spacing={4} p={{ md: fr.spacing("6v") }} sx={{ position: "relative", zIndex: 2 }}>
            <Grid size={{ md: 7, xs: 12 }} gap={2} display={"flex"} flexDirection={"column"}>
              <Typography component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }} gutterBottom>
                Ressources recruteur
              </Typography>
              <Typography component={"p"} variant="body1" display={{ md: "block", xs: "none" }}>
                La bonne alternance vous propose un ensemble d’informations et d’outils pour faciliter vos démarches liées à l'alternance.
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Grid container spacing={2}>
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
                padding: fr.spacing("3w"),
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
              <AllerPlusLoinItem {...ARTICLES["je-suis-employeur-public"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["cerfa-apprentissage-et-professionnalisation"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["aides-a-l-embauche-en-alternance"]} />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem {...ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"]} />
            </Grid>
          </Grid>
          <Grid
            container
            size={12}
            sx={{
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              "& .fr-card__content": {
                paddingTop: fr.spacing("3w"),
                paddingBottom: fr.spacing("4w"),
              },
              "& .fr-card__title ::after": {
                display: "none",
              },
              padding: fr.spacing("4w"),
              marginTop: fr.spacing("4w"),
            }}
          >
            <Grid size={12}>
              <Typography component={"h2"} variant="h2">
                Testez vos connaissances
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography component={"span"} variant="body1">
                Entraînez-vous avec notre premier parcours de mise en situation à destination des recruteurs :
              </Typography>
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <QuizItem
                title="Vous vous apprêtez à accueillir un·e alternant·e ? "
                desc="Découvrez les étapes clés pour réussir son intégration"
                href="https://dinum.didask.com/courses/lalternance-pour-les-recruteurs/65b8129d2ff4dca088d2bfce"
              />
            </Grid>
          </Grid>
          <Grid container size={12} spacing={2}>
            <Grid size={12} my={fr.spacing("6v")}>
              <Typography component="h2" variant="h2">
                Liens utiles
              </Typography>
              <Divider
                sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
              />
            </Grid>
            <Grid size={12} mx={fr.spacing("4w")}>
              <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense>
                <ListItem sx={{ display: "list-item", flex: "1" }}>
                  <Box display={"flex"} flexDirection={"row"} gap={1}>
                    <Typography fontWeight={700}>Estimez le coût d’un alternant</Typography> pour votre entreprise avec le simulateur de l’URSSAF.
                    <DsfrLink
                      href="https://www.alternance.emploi.gouv.fr/simulateur-employeur/etape-1"
                      aria-label="Consulter le simulateur de l’URSSAF pour estimer le coût d’un alternant"
                    >
                      En savoir plus
                    </DsfrLink>
                  </Box>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Depuis février 2025, le Gouvernement a mis à jour l’aide aux entreprises, allant jusqu’à 6000 euros s'il s'agit d'un apprenti en situation de handicap.{" "}
                  <DsfrLink
                    href="https://entreprendre.service-public.gouv.fr/vosdroits/F23556"
                    aria-label="Consulter les informations sur l’aide aux entreprises pour les apprentis en situation de handicap"
                  >
                    En savoir plus
                  </DsfrLink>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  <Typography component="span" fontWeight={700}>
                    Retrouvez les informations légales de votre entreprise
                  </Typography>{" "}
                  sur l’annuaire des entreprises, à partir de votre SIRET.
                  <DsfrLink href="https://annuaire-entreprises.data.gouv.fr/" aria-label="Consulter l’annuaire des entreprises">
                    En savoir plus
                  </DsfrLink>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  <Typography fontWeight={700}>Chaque entreprise est rattachée à un Opérateur de compétences (OPCO).</Typography> Il s’agit de votre interlocuteur de proximité pour
                  vos démarches liées à l’alternance (financement des contrats, formation, ...). Votre OPCO peut vous aider à affiner vos besoins de recrutement. Aussi, sachez
                  qu’en déposant une offre d’emploi en alternance sur le site de votre OPCO, celle-ci sera rediffusée sur les sites consultés par les jeunes. Vous ne connaissez pas
                  votre OPCO ? Retrouvez votre OPCO sur
                  <DsfrLink href="https://quel-est-mon-opco.francecompetences.fr/" aria-label="Consulter le site France compétences">
                    France compétences
                  </DsfrLink>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  Les Directions régionales de l’économie, de l’emploi, du travail et des solidarités (
                  <DsfrLink
                    href="https://entreprendre.service-public.gouv.fr/vosdroits/F23556"
                    aria-label="Consulter les informations sur les Directions régionales de l’économie, de l’emploi, du travail et des solidarités"
                  >
                    DREETS
                  </DsfrLink>
                  ) sont les services déconcentrés du Ministère du Travail, de la Santé et des Solidarités. Vous pouvez les contacter pour toute question relative au contrat
                  d’apprentissage et de professionnalisation, au droit du travail, à l’activité des organismes de formation.
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  L’
                  <DsfrLink href="https://www.asp.gouv.fr/" aria-label="Consulter le site de l’Agence de services et de paiement">
                    Agence de services et de paiement
                  </DsfrLink>{" "}
                  (ASP) est l’opérateur de l’État chargé du paiement des aides publiques. Vous pouvez la contacter pour toute question relative au versement de l’aide au
                  recrutement d’alternants ou de l’aide au financement du permis de conduire pour les apprentis.
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
                <ListItem sx={{ display: "list-item", flex: "1" }}>
                  Le contrat en apprentissage{" "}
                  <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319" aria-label="Consulter le Cerfa n° 10103*11">
                    Cerfa n° 10103*11
                  </DsfrLink>{" "}
                  doit être signé et transmis à votre OPCO{" "}
                  <Typography component="span" fontWeight={700}>
                    au plus tard 5 jours après le démarrage du contrat.
                  </Typography>{" "}
                  Gagnez du temps ! Optimisez la création de vos contrats d’apprentissage avec le service{" "}
                  <DsfrLink href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319" aria-label="Consulter le service CERFA dématérialisé">
                    CERFA dématérialisé
                  </DsfrLink>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>En tant qu’employeur, vous devez conserver le contrat signé pendant 5 ans en cas de contrôle.</ListItem>
              </List>
            </Grid>
            <Grid
              container
              size={12}
              sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover, borderRadius: fr.spacing("2v"), padding: fr.spacing("4w"), marginTop: fr.spacing("4w") }}
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
              <DocumentGridItem title="Précis de l'apprentissage" link="https://travail-emploi.gouv.fr/precis-de-lapprentissage" />
              <DocumentGridItem
                title="Guide apprentissage et handicap"
                link="https://travail-emploi.gouv.fr/apprentissage-et-handicap-un-guide-pour-les-employeurs-et-les-apprentis#Qu-est-ce-que-le-contrat-d-apprentissage-amenage"
              />
              <DocumentGridItem
                title="Guide sur les aides aux contrats en alternance"
                link="https://travail-emploi.gouv.fr/aides-aux-contrats-en-alternance-guide-pratique-destination-des-employeurs-et-des-organismes-de-formation"
              />
              <DocumentGridItem
                title="Guide relatif à l'apprentissage à destination des employeurs publics de la fonction publique de l'État"
                link="https://www.fonction-publique.gouv.fr/toutes-les-publications/guide-relatif-lapprentissage-destination-des-employeurs-publics"
              />
              <DocumentGridItem title="CERFA Apprentissage" link="https://www.service-public.gouv.fr/particuliers/vosdroits/R1319" />
              <DocumentGridItem title="CERFA Professionnalisation" link="https://www.service-public.gouv.fr/particuliers/vosdroits/R10338" />
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
                desc="Pour bien mener vos démarches liées à l'alternance."
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
                title="Ressources organismes de formation"
                desc="Des ressources pour vous et vos alternants."
                linkProps={{
                  href: PAGES.static.guideCFA.getPath(),
                }}
                enlargeLink
                shadow
                style={{ height: "100%" }}
              />
            </Grid>
          </Grid>
          <Grid container size={12} sx={{ px: fr.spacing("3w"), py: fr.spacing("2w"), my: fr.spacing("6v") }}>
            <Grid size={{ md: 3, xs: 12 }}>
              <Image src="/images/guides/guide-cfa/recruteur.svg" width={200} height={120} alt="" />
            </Grid>
            <Grid size={{ md: 9, xs: 12 }} sx={{ display: "flex", alignItems: "center" }}>
              <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("2w")} my={fr.spacing("2w")}>
                <Typography variant="body1" fontWeight={500}>
                  Diffusez simplement et gratuitement vos offres en alternance
                </Typography>
                <Box>
                  <DsfrLink href={PAGES.static.home.getPath()} aria-label="Accéder à la page d'accueil">
                    Accéder à la page d'accueil
                    <DsfrIcon name="fr-icon-arrow-right-line" size={16} ml={fr.spacing("2v")} marginRight={"0 !important"} />
                  </DsfrLink>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Grid container size={12} sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover, px: fr.spacing("3w"), py: fr.spacing("2w"), my: fr.spacing("6v") }}>
            <Grid size={{ md: 10, xs: 12 }}>
              <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("2w")} my={fr.spacing("2w")}>
                <Typography variant="body1" fontWeight={500}>
                  Vous avez une question sur le fonctionnement de notre plateforme ?
                </Typography>
                <Box>
                  <DsfrLink href={PAGES.static.faq.getPath()} aria-label="Consulter la Foire aux questions">
                    Consulter la FAQ
                    <DsfrIcon name="fr-icon-arrow-right-line" size={16} ml={fr.spacing("2v")} marginRight={"0 !important"} />
                  </DsfrLink>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ md: 2, xs: 12 }}>
              <Image src="/images/guides/faq.svg" width={200} height={110} alt="" />
            </Grid>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}

export default GuideRecruteur
