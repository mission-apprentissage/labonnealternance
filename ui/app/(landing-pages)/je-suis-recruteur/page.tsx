import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Divider, Grid, List, ListItem, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { AppreciationUsagers } from "@/app/(home)/_components/AppreciationUsagers"
import { GrandsGroupesRecruteur } from "@/app/(home)/_components/GrandsGroupesRecruteur"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { getDepotCtaHref } from "@/services/getDepotCtaHref"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

export const cardSx = {
  backgroundColor: "white",
  padding: fr.spacing("7v"),
  borderRadius: fr.spacing("1v"),
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  textAlign: "center",
}

export const metadata: Metadata = PAGES.static.jeSuisRecruteur.getMetadata()
const JeSuisRecruteurPage = async () => {
  const { user } = await getSession()

  const ctaDepotHref: string = getDepotCtaHref(user, "ENTREPRISE")

  return (
    <>
      <Box
        sx={{
          mb: fr.spacing("6v"),
        }}
      >
        <SchemaOrg
          type="WebPage"
          title={PAGES.static.jeSuisRecruteur.getMetadata().title}
          description={PAGES.static.jeSuisRecruteur.getMetadata().description}
          url={PAGES.static.jeSuisRecruteur.getPath()}
          breadcrumbs={[
            { name: PAGES.static.home.title, url: PAGES.static.home.getPath() },
            { name: PAGES.static.jeSuisRecruteur.title, url: PAGES.static.jeSuisRecruteur.getPath() },
          ]}
        />
        <Breadcrumb pages={[PAGES.static.jeSuisRecruteur]} />
        <DefaultContainer>
          <Grid container spacing={fr.spacing("4v")} id="landing-page-content">
            <Grid
              size={{ md: 6, xs: 12 }}
              spacing={{ md: fr.spacing("16v"), xs: fr.spacing("8v") }}
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"center"}
              gap={fr.spacing("5v")}
            >
              <Typography variant="h1" component="h1" gutterBottom color={fr.colors.decisions.text.title.blueFrance.default}>
                Vous êtes une entreprise
              </Typography>
              <Typography variant="h2" component="h2" gutterBottom color={fr.colors.decisions.text.default.grey.default}>
                Diffusez simplement et gratuitement vos offres en alternance
              </Typography>
              <Typography variant="body1" gutterBottom>
                Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des centres de formation pouvant vous accompagner.
              </Typography>
              <Box display={"flex"} flexDirection={"row"} gap={fr.spacing("4v")}>
                <Button linkProps={{ href: ctaDepotHref }} priority="primary">
                  Déposer une offre
                </Button>
                <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
                  Me connecter
                </Button>
              </Box>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }} display={"flex"} flexDirection={"column"} justifyContent={"center"}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-recruteur/illu-votre-besoin.svg"}
                alt=""
                width={716}
                height={414}
                unoptimized
                style={{ width: "100%", height: "auto" }}
                aria-hidden={true}
              />
            </Grid>
          </Grid>
          <Grid
            container
            sx={{
              mt: fr.spacing("8v"),
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
            }}
          >
            <Grid container display={"flex"} flexDirection={"row"} spacing={fr.spacing("4v")}>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }}>
                <Image
                  fetchPriority="low"
                  src={"/images/je-suis-recruteur/illu-offre-emploi.svg"}
                  alt=""
                  width={529}
                  height={281}
                  unoptimized
                  style={{ width: "100%", height: "auto" }}
                  aria-hidden={true}
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("4v") } }}>
                <Typography component={"h2"} variant={"h3"}>
                  Postez votre offre d’alternance en quelques secondes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans votre compte en vous connectant avec votre email
                  uniquement.
                </Typography>
              </Grid>
            </Grid>
            <Grid container display={"flex"} flexDirection={{ md: "row", xs: "column-reverse" }} spacing={fr.spacing("4v")}>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("4v") } }}>
                <Typography component={"h2"} variant={"h3"}>
                  Vos offres sont diffusées gratuitement au plus près des candidats
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
                  <DsfrLink href={PAGES.static.home.getPath()} aria-label="Consulter le site La bonne alternance">
                    La bonne alternance
                  </DsfrLink>
                  ,{" "}
                  <DsfrLink href="https://www.francetravail.fr/accueil/" aria-label="Consulter le site de France Travail">
                    France Travail
                  </DsfrLink>
                  ,{" "}
                  <DsfrLink href="https://parcoursup.fr" aria-label="Consulter le site Parcoursup">
                    Parcoursup
                  </DsfrLink>
                  ,{" "}
                  <DsfrLink href="https://www.hellowork.com" aria-label="Consulter le site HelloWork">
                    HelloWork
                  </DsfrLink>{" "}
                  et{" "}
                  <DsfrLink
                    href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"
                    aria-label="Consulter les autres partenaires de La bonne alternance"
                  >
                    bien d’autres
                  </DsfrLink>
                  .
                </Typography>
              </Grid>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }}>
                <Image
                  fetchPriority="low"
                  src={"/images/je-suis-recruteur/illu-plateforme-jeunes.svg"}
                  alt=""
                  width={504}
                  height={292}
                  unoptimized
                  style={{ width: "100%", height: "auto" }}
                  aria-hidden={true}
                />
              </Grid>
            </Grid>
            <Grid container display={"flex"} flexDirection={"row"} spacing={fr.spacing("4v")}>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }}>
                <Image
                  fetchPriority="low"
                  src={"/images/je-suis-recruteur/illu-soliciter-cfa.svg"}
                  alt=""
                  width={561}
                  height={378}
                  unoptimized
                  style={{ width: "100%", height: "auto" }}
                  aria-hidden={true}
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("4v") } }}>
                <Typography component={"h2"} variant={"h3"}>
                  Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin d’accélérer vos recrutements.
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: fr.spacing("10v"),
              mb: fr.spacing("8v"),
              py: fr.spacing("8v"),
              px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              display: "flex",
              flexDirection: "column",
              gap: fr.spacing("10v"),
            }}
          >
            <Typography component="h1" variant="h1">
              Nos offres d’emploi en alternance
              <br />
              <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
                en chiffres
              </Box>
            </Typography>
            <Box sx={{ width: "13%", minWidth: "80px", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                gap: fr.spacing("4v"),
                alignItems: "stretch",
                mt: fr.spacing("4v"),
              }}
            >
              <Box sx={{ ...cardSx }}>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                  <Image src="/images/home_pics/icons/malette.svg" alt="" aria-hidden={true} width={80} height={80} />
                </Typography>
                <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>+ 347 000</Typography>
                <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                  offres en alternance
                  <br />
                  collectées sur les 12 derniers mois
                </Typography>
              </Box>
              <Box sx={{ ...cardSx }}>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                  <Image src="/images/home_pics/icons/file_eyes.svg" alt="" aria-hidden={true} width={80} height={80} />
                </Typography>
                <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>17</Typography>
                <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                  consultations
                  <br />
                  en moyenne par offre
                </Typography>
              </Box>
              <Box sx={{ ...cardSx }}>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                  <Image src="/images/home_pics/icons/files.svg" alt="" aria-hidden={true} width={80} height={80} />
                </Typography>
                <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>11</Typography>
                <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                  candidatures
                  <br />
                  en moyenne par offre
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#161616" }}>* Données calculées sur l'année 2025</Typography>
          </Box>

          <Box sx={{ mt: { xs: fr.spacing("6v"), md: fr.spacing("20v") } }}>
            <GrandsGroupesRecruteur />
          </Box>
          <Box sx={{ mt: { xs: fr.spacing("6v"), md: fr.spacing("20v") } }}>
            <AppreciationUsagers realm="recruteur" />
          </Box>

          <Grid
            container
            sx={{
              mt: { md: fr.spacing("16v"), xs: fr.spacing("8v") },
            }}
            spacing={fr.spacing("4v")}
          >
            <Grid size={12} sx={{ display: "flex", flexDirection: "column", my: "auto", justifyContent: "center" }}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-recruteur/illu-lba.svg"}
                alt=""
                width={212}
                height={145}
                unoptimized
                style={{ width: "100%", margin: "auto" }}
                aria-hidden={true}
              />
              <Typography component={"h2"} variant={"h4"} align="center">
                Pour vous aider dans vos démarches de recrutement en alternance
              </Typography>
            </Grid>
            <Grid container spacing={fr.spacing("4v")} sx={{ mt: fr.spacing("4v") }}>
              <Grid size={{ md: 6, xs: 12 }}>
                <Card
                  title="Je m'informe sur l'alternance"
                  desc="Les réponses à vos questions pour tout savoir sur l’alternance"
                  linkProps={{ href: `${PAGES.static.guideDecouvrirLAlternance.getPath()}?source=guide-recruteur` }}
                  imageUrl="/images/guides/decouvrir-l-alternance.svg"
                  imageAlt=""
                  horizontal
                  style={{
                    height: "100%",
                  }}
                  enlargeLink
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }}>
                <Card
                  title="Cerfa apprentissage et professionnalisation : le guide complet"
                  desc="Guide des démarches administratives pour les employeurs"
                  linkProps={{ href: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getPath() }}
                  imageUrl="/images/guides/guide-recruteur/cerfa-apprentissage-et-professionnalisation.svg"
                  imageAlt=""
                  horizontal
                  style={{
                    height: "100%",
                  }}
                  enlargeLink
                />
              </Grid>
            </Grid>
            <Grid size={12} sx={{ display: "flex", flexDirection: "column", my: "auto", justifyContent: "center" }}>
              <Button linkProps={{ href: PAGES.static.guideRecruteur.getPath() }} priority="secondary" style={{ margin: "auto" }}>
                Découvrir toutes les ressources
              </Button>
            </Grid>
          </Grid>
          <Grid
            container
            sx={{
              mt: { md: fr.spacing("16v"), xs: fr.spacing("8v") },
              backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
              borderRadius: fr.spacing("2v"),
              padding: { md: fr.spacing("12v"), xs: fr.spacing("3v") },
              mb: fr.spacing("16v"),
            }}
            spacing={{
              md: fr.spacing("8v"),
              xs: fr.spacing("4v"),
            }}
          >
            <Grid size={12} spacing={fr.spacing("8v")}>
              <Typography component="h2" variant="h2">
                La bonne alternance révèle
              </Typography>
              <Typography component="h2" variant="h2" color={fr.colors.decisions.text.default.info.default}>
                le marché caché de l’emploi
              </Typography>
              <Divider
                sx={{ width: fr.spacing("16v"), height: 0, background: "none", borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}` }}
              />
            </Grid>
            <Grid size={{ md: 7, xs: 12 }} lineHeight={fr.spacing("8v")}>
              <Typography fontSize={fr.spacing("4v")}>
                Le saviez-vous ? Afin d’aider les candidats intéressés par l'alternance à trouver un contrat, nous exposons différents types d'entreprises sur notre service :{" "}
              </Typography>
              <Typography fontWeight={"bold"} fontSize={fr.spacing("4v")}>
                Celles ayant émis un besoin en recrutement
              </Typography>{" "}
              <Typography fontSize={fr.spacing("4v")}>sur notre plateforme ainsi que sur France Travail et ses sites partenaires</Typography>
              <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense>
                <ListItem sx={{ display: "list-item" }}>
                  <Typography>
                    <span className="fr-text--bold">Celles ayant émis un besoin en recrutement</span> sur notre plateforme ainsi que sur France Travail et ses sites partenaires
                  </Typography>
                </ListItem>
                <ListItem sx={{ display: "list-item" }}>
                  <Typography>
                    <span className="fr-text--bold">Celles n'ayant pas diffusé d'offres, mais ayant été identifiées comme "à fort potentiel d'embauche en alternance"</span> par un
                    algorithme prédictif de France Travail, qui analyse les recrutements des 6 années passées en CDI, CDD de plus de 30 jours et alternance. L’objectif de cet
                    algorithme est de rendre accessible le marché caché de l’emploi, et ainsi faciliter les démarches de candidatures spontanées des usagers du service.
                  </Typography>
                </ListItem>
              </List>
              <DsfrLink href={PAGES.static.desinscription.getPath()} aria-label="Se désinscrire des candidatures spontanées">
                Je ne souhaite plus recevoir de candidature spontanée
              </DsfrLink>
            </Grid>
            <Grid size={{ md: 5, xs: 12 }} sx={{ mb: "auto" }}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-recruteur/illu-marche-cache.svg"}
                alt=""
                width={398}
                height={431}
                unoptimized
                style={{ width: "100%" }}
                aria-hidden={true}
              />
            </Grid>
          </Grid>
        </DefaultContainer>
      </Box>
    </>
  )
}

export default JeSuisRecruteurPage
