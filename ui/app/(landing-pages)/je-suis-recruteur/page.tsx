import type { Metadata } from "next"
import { Box, Grid, Typography, Divider, List, ListItem } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Image from "next/image"
import Card from "@codegouvfr/react-dsfr/Card"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { Breadcrumb } from "@/app/_components/Breadcrumb"

export const metadata: Metadata = PAGES.static.jeSuisRecruteur.getMetadata()
const JeSuisRecruteurPage = () => {
  return (
    <Box
      sx={{
        mb: fr.spacing("6v"),
      }}
    >
      <Breadcrumb pages={[PAGES.static.jeSuisCFA]} />
      <DefaultContainer>
        <Grid container spacing={fr.spacing("4v")}>
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
              <Button linkProps={{ href: PAGES.static.espaceProCreationEntreprise.getPath() }} priority="primary">
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
            borderRadius: fr.spacing("5v"),
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
                <DsfrLink href="https://www.1jeune1solution.gouv.fr" aria-label="Consulter le site 1jeune1solution">
                  1jeune1solution
                </DsfrLink>
                ,{" "}
                <DsfrLink href="https://www.parcoursup.fr" aria-label="Consulter le site Parcoursup">
                  Parcoursup
                </DsfrLink>{" "}
                et bien d’autres.
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
                linkProps={{ href: PAGES.static.guideRecruteurDecouvrirLAlternance.getPath() }}
                imageUrl="/images/guides/guide-recruteur/decouvrir-l-alternance.svg"
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
            borderRadius: fr.spacing("5v"),
            padding: { md: fr.spacing("12v"), xs: fr.spacing("3v") },
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
            <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense>
              <ListItem sx={{ display: "list-item" }}>
                <Typography component="span" variant="body1" fontWeight={"bold"} fontSize={fr.spacing("4v")}>
                  Celles ayant émis un besoin en recrutement
                </Typography>{" "}
                <Typography component="span" variant="body1" fontSize={fr.spacing("4v")}>
                  sur notre plateforme ainsi que sur France Travail et ses sites partenaires
                </Typography>
              </ListItem>
              <ListItem sx={{ display: "list-item" }}>
                <Typography component="span" variant="body1" fontWeight={"bold"}>
                  Celles n'ayant pas diffusé d'offres, mais ayant été identifiées comme "à fort potentiel d'embauche en alternance"
                </Typography>{" "}
                <Typography component="span" variant="body1" fontSize={fr.spacing("4v")}>
                  par un algorithme prédictif de France Travail, qui analyse les recrutements des 6 années passées en CDI, CDD de plus de 30 jours et alternance. L’objectif de cet
                  algorithme est de rendre accessible le marché caché de l’emploi, et ainsi faciliter les démarches de candidatures spontanées des usagers du service.
                </Typography>
              </ListItem>
            </List>
            <DsfrLink href={PAGES.static.guideRecruteurDecouvrirLAlternance.getPath()}>Je ne souhaite plus recevoir de candidature spontanée</DsfrLink>
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
        <Grid container spacing={fr.spacing("8v")} sx={{ mt: fr.spacing("16v") }}>
          <Grid size={12}>
            <Box sx={{ display: "flex", flexDirection: "row", mx: "auto", justifyContent: "center" }}>
              <Typography component={"h2"} variant={"h2"}>
                Vous souhaitez recruter un alternant pour votre entreprise ?
              </Typography>
            </Box>
          </Grid>
          <Grid size={12} sx={{ display: "flex", flexDirection: "row", my: "auto", justifyContent: "center" }} gap={fr.spacing("4v")}>
            <Button linkProps={{ href: PAGES.static.espaceProCreationEntreprise.getPath() }} priority="primary">
              Déposer une offre
            </Button>
            <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
              Me connecter
            </Button>
          </Grid>
        </Grid>
        <Grid
          container
          sx={{
            mt: fr.spacing("16v"),
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
            borderRadius: fr.spacing("5v"),
            padding: { md: fr.spacing("12v"), xs: fr.spacing("3v") },
          }}
          spacing={fr.spacing("8v")}
        >
          <Grid size={{ md: 9, xs: 12 }} display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")}>
            <Typography fontWeight={"bold"}>
              La bonne alternance est édité par la Délégation générale à l’emploi et à la formation professionnelle (DGEFP) et conçoit des services numériques qui facilitent les
              entrées en apprentissage.
            </Typography>
            <Typography component={"h2"} variant={"h2"} color={fr.colors.decisions.text.title.blueFrance.default} textAlign={{ md: "start", xs: "center" }}>
              Rendez-vous sur LinkedIn pour suivre nos actualités
            </Typography>
          </Grid>
          <Grid size={{ md: 3, xs: 12 }} sx={{ my: "auto" }}>
            <Box sx={{ display: "flex", flexDirection: "row", my: "auto", justifyContent: "center" }}>
              <Button linkProps={{ href: "https://www.linkedin.com/company/la-bonne-alternance/posts/" }} priority="primary">
                Voir notre page Linkedin
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}

export default JeSuisRecruteurPage
