import type { Metadata } from "next"
import { Grid, Typography } from "@mui/material"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Image from "next/image"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const metadata: Metadata = PAGES.static.jeSuisCFA.getMetadata()

const JeSuisCFAPage = () => {
  return (
    <DefaultContainer>
      <Grid container mt={fr.spacing("4w")}>
        <Grid size={{ md: 6, xs: 12 }} display="flex" flexDirection={"column"} gap={fr.spacing("2w")}>
          <Typography variant="h1" component="h1" gutterBottom color={fr.colors.decisions.text.title.blueFrance.default}>
            Vous êtes un organisme de formation
          </Typography>
          <Typography variant="h2" component="h2" gutterBottom color={fr.colors.decisions.text.default.grey.default}>
            Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois
          </Typography>
          <Typography variant="body1" gutterBottom>
            Créez le compte de votre CFA pour diffuser les offres de vos entreprises partenaires, et recevoir les candidatures.{" "}
          </Typography>
          <Grid container display={"flex"} flexDirection={"row"} gap={fr.spacing("4v")}>
            <Grid size={{ md: 6, xs: 12 }} display={"flex"} justifyContent={{ md: "flex-start", xs: "center" }}>
              <Button linkProps={{ href: PAGES.static.espaceProCreationCfa.getPath() }} priority="primary">
                Créer mon espace dédié
              </Button>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }} display={"flex"} justifyContent={{ md: "flex-start", xs: "center" }}>
              <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
                Me connecter
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ md: 6, xs: 0 }}>
          <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-entreprises-mandatees.svg"} alt="" width={716} height={414} unoptimized style={{ width: "100%" }} />
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          mt: fr.spacing("8w"),
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          borderRadius: fr.spacing("5v"),
          padding: { md: fr.spacing("6w"), xs: fr.spacing("3v") },
        }}
      >
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
          <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-rdv.svg"} alt="" width={586} height={298} unoptimized style={{ width: "100%" }} />
        </Grid>
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("2w") } }}>
          <Typography component={"h2"} variant={"h3"}>
            Vos formations en alternance sont automatiquement exposées
          </Typography>
          <Typography variant="body1" gutterBottom>
            Pour référencer et mettre à jour vos formations sur La bonne alternance, nul besoin de vous créer un compte, il vous suffit de les déclarer auprès du Carif-Oref de
            votre région.
          </Typography>
          <Typography>
            Elles sont ensuite nationalement agrégées par le Réseau des Carif-Oref puis automatiquement exposées sur La bonne alternance.{" "}
            <DsfrLink href={PAGES.static.faq.getPath()} aria-label="Consulter la foire aux questions">
              En savoir plus
            </DsfrLink>
          </Typography>
        </Grid>
        <Grid container display={"flex"} flexDirection={{ md: "row", xs: "column-reverse" }}>
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("2w") } }}>
            <Typography component={"h2"} variant={"h3"}>
              Répondez facilement aux candidats intéressés par vos formations
            </Typography>
            <Typography variant="body1" gutterBottom>
              Vous recevez directement dans votre boite mail des demandes de candidats intéressés par vos formations et pouvez leur répondre en quelques clics.
            </Typography>
            <Typography variant="caption">
              *Vous pouvez à tout moment vous désinscrire de ce service en{" "}
              <DsfrLink href={PAGES.static.contact.getPath()} aria-label="Consulter la page de contact">
                contactant notre équipe.
              </DsfrLink>
            </Typography>
          </Grid>
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
            <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-contact-candidat.svg"} alt="" width={586} height={298} unoptimized style={{ width: "100%" }} />
          </Grid>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          mt: fr.spacing("8w"),
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          borderRadius: fr.spacing("5v"),
          padding: { md: fr.spacing("6w"), xs: fr.spacing("3v") },
        }}
      >
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
          <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-liste-offres.svg"} alt="" width={585} height={298} unoptimized style={{ width: "100%" }} />
        </Grid>
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("2w") } }}>
          <Typography component={"h2"} variant={"h3"}>
            Développez et gérez vos entreprises partenaires
          </Typography>
          <Typography variant="body1" gutterBottom>
            3 étapes seulement pour mettre en ligne les besoins de vos entreprises partenaires. Vos offres regroupant formation et emploi seront mises en avant sur les différents
            sites.
          </Typography>
          <Typography variant="body1" gutterBottom>
            Recevez dans votre boîte mail des demandes de contact d’entreprises en recherche d’alternants.
          </Typography>
        </Grid>
        <Grid container display={"flex"} flexDirection={{ md: "row", xs: "column-reverse" }}>
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("2w") } }}>
            <Typography component={"h2"} variant={"h3"}>
              Vos offres sont diffusées gratuitement au plus près des candidats
            </Typography>
            <Typography variant="body1" gutterBottom>
              Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
              <DsfrLink href={PAGES.static.home.getPath()} aria-label="Consulter le site La bonne alternance">
                La bonne alternance
              </DsfrLink>
              ,{" "}
              <DsfrLink href="https://1jeune1solution.fr" aria-label="Consulter le site 1jeune1solution">
                1jeune1solution
              </DsfrLink>
              ,{" "}
              <DsfrLink href="https://parcoursup.fr" aria-label="Consulter le site Parcoursup">
                Parcoursup
              </DsfrLink>{" "}
              et bien d’autres.
            </Typography>
          </Grid>
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
            <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-partenaires.svg"} alt="" width={504} height={284} unoptimized style={{ width: "100%" }} />
          </Grid>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          mt: fr.spacing("8w"),
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          borderRadius: fr.spacing("5v"),
          padding: { md: fr.spacing("6w"), xs: fr.spacing("3v") },
        }}
        spacing={6}
      >
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
          <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-carte-metiers.svg"} alt="" width={532} height={310} unoptimized style={{ width: "100%" }} />
        </Grid>
        <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("2w") } }} display="flex" flexDirection="column" gap={2}>
          <Typography component={"h2"} variant={"h3"}>
            Accédez à la carte des métiers
          </Typography>
          <Typography variant="body1" gutterBottom>
            La carte d’étudiant des métiers ouvre droit à de nombreuses réductions pour vos alternants. Vous devez leur délivrer la carte dans les 30 jours qui suivent leur
            inscription.
          </Typography>
          <Grid container display={"flex"} flexDirection={"row"} spacing={2}>
            <Grid size={{ md: 6, xs: 12 }} display={"flex"} justifyContent={{ md: "flex-end", xs: "center" }}>
              <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
                Me connecter
              </Button>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }} display={"flex"} justifyContent={{ md: "flex-start", xs: "center" }}>
              <Button linkProps={{ href: PAGES.static.espaceProCreationCfa.getPath() }} priority="secondary">
                Me créer un compte
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container sx={{ mt: fr.spacing("8w") }} spacing={4}>
        <Grid size={12} sx={{ display: "flex", flexDirection: "column", my: "auto", justifyContent: "center" }} gap={2}>
          <Image fetchPriority="low" src={"/images/je-suis-cfa/illu-lba.svg"} alt="" width={212} height={145} unoptimized style={{ width: "100%", margin: "auto" }} />
          <Typography component={"h2"} variant={"h4"} align="center">
            La bonne alternance recense une liste d’outils et de liens utiles pour les organismes de formation qui accompagnent des jeunes dans leurs recherches de contrat.{" "}
          </Typography>
        </Grid>
        <Grid size={12} sx={{ display: "flex", flexDirection: "column", my: "auto", justifyContent: "center" }}>
          <Button linkProps={{ href: PAGES.static.guideCFA.getPath() }} priority="secondary" style={{ margin: "auto" }}>
            Découvrir toutes les ressources
          </Button>
        </Grid>
      </Grid>
    </DefaultContainer>
  )
}

export default JeSuisCFAPage
