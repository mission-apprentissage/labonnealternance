import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { AUTHTYPE } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { AppreciationUsagers } from "@/app/(home)/_components/AppreciationUsagers"
import { cardSx } from "@/app/(landing-pages)/je-suis-recruteur/page"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { getDepotCtaHref } from "@/services/getDepotCtaHref"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.jeSuisCFA.getMetadata()

const JeSuisCFAPage = async () => {
  const { user } = await getSession()
  const isCfaConnected = user && user.type === AUTHTYPE.CFA

  const ctaDepotHref: string = getDepotCtaHref(user, "CFA")

  return (
    <Box
      sx={{
        mb: fr.spacing("6v"),
      }}
    >
      <SchemaOrg
        type="WebPage"
        title={PAGES.static.jeSuisCFA.getMetadata().title}
        description={PAGES.static.jeSuisCFA.getMetadata().description}
        url={PAGES.static.jeSuisCFA.getPath()}
        breadcrumbs={[
          { name: PAGES.static.home.title, url: PAGES.static.home.getPath() },
          { name: PAGES.static.jeSuisCFA.title, url: PAGES.static.jeSuisCFA.getPath() },
        ]}
      />
      <Breadcrumb pages={[PAGES.static.jeSuisCFA]} />
      <DefaultContainer>
        <Grid container>
          <Grid
            size={{ md: 6, xs: 12 }}
            spacing={{ md: fr.spacing("16v"), xs: fr.spacing("8v") }}
            display={"flex"}
            flexDirection={"column"}
            justifyContent={"center"}
            gap={fr.spacing("5v")}
            id="landing-page-content"
          >
            <Typography variant="h1" component="h1" gutterBottom color={fr.colors.decisions.text.title.blueFrance.default}>
              Vous êtes un organisme de formation
            </Typography>
            <Typography variant="h2" component="h2" gutterBottom color={fr.colors.decisions.text.default.grey.default}>
              Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emploi
            </Typography>
            <Typography variant="body1" gutterBottom>
              Créez le compte de votre CFA pour diffuser les offres de vos entreprises partenaires, et recevoir les candidatures.{" "}
            </Typography>
            <Box display={"flex"} flexDirection={{ md: "row", xs: "column" }} gap={fr.spacing("4v")} justifyContent={{ md: "start", xs: "center" }} textAlign={"center"}>
              <Box>
                <Button linkProps={{ href: ctaDepotHref }} priority="primary">
                  Créer mon espace dédié
                </Button>
              </Box>
              <Box>
                <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
                  Me connecter
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ md: 6, xs: 0 }} display={"flex"} flexDirection={"column"} justifyContent={"center"}>
            <Image
              fetchPriority="low"
              src={"/images/je-suis-cfa/illu-entreprises-mandatees.svg"}
              alt=""
              width={678}
              height={337}
              unoptimized
              style={{ width: "100%", height: "auto" }}
              aria-hidden={true}
            />
          </Grid>
        </Grid>
        <Grid
          container
          sx={{
            mt: fr.spacing("16v"),
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
            borderRadius: fr.spacing("2v"),
            padding: { md: fr.spacing("12v"), xs: fr.spacing("3v") },
          }}
        >
          <Grid container display={"flex"} flexDirection={"row"} spacing={fr.spacing("4v")}>
            <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-cfa/illu-rdv.svg"}
                alt=""
                width={586}
                height={298}
                unoptimized
                style={{ width: "100%", height: "auto" }}
                aria-hidden={true}
              />
            </Grid>
            <Grid
              size={{ md: 6, xs: 12 }}
              sx={{ my: { md: "auto", xs: fr.spacing("4v") }, px: { md: fr.spacing("4v") } }}
              display={"flex"}
              flexDirection={"column"}
              gap={fr.spacing("4v")}
            >
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
          </Grid>
          <Grid container display={"flex"} flexDirection={{ md: "row", xs: "column-reverse" }} spacing={fr.spacing("4v")}>
            <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }} display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")}>
              <Typography component={"h2"} variant={"h3"}>
                Répondez facilement aux candidats intéressés par vos formations
              </Typography>
              <Typography variant="body1" gutterBottom>
                Vous recevez directement dans votre boîte mail des demandes de candidats intéressés par vos formations et pouvez leur répondre en quelques clics.
              </Typography>
              <Typography variant="caption">
                *Vous pouvez à tout moment vous désinscrire de ce service en{" "}
                <DsfrLink href={PAGES.static.contact.getPath()} aria-label="Consulter la page de contact">
                  <Typography variant="caption">contactant notre équipe.</Typography>
                </DsfrLink>
              </Typography>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: { md: "auto", xs: fr.spacing("4v") }, xs: fr.spacing("4v") } }}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-cfa/illu-contact-candidat.svg"}
                alt=""
                width={586}
                height={298}
                unoptimized
                style={{ width: "100%", height: "auto" }}
                aria-hidden={true}
              />
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
                <Image src="/images/home_pics/icons/file_eyes.svg" alt="" aria-hidden={true} width={80} height={80} />
              </Typography>
              <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>+ 60 000</Typography>
              <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                formations exposées
                <br />
                sur La bonne alternance
              </Typography>
            </Box>
            <Box sx={{ ...cardSx }}>
              <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                <Image src="/images/home_pics/icons/envelop.svg" alt="" aria-hidden={true} width={80} height={80} />
              </Typography>
              <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>+ 100 000</Typography>
              <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                demandes envoyées
                <br />
                par les candidats aux CFA
              </Typography>
            </Box>
            <Box sx={{ ...cardSx }}>
              <Typography sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4B9F6C" }}>
                <Image src="/images/home_pics/icons/ordi.svg" alt="" aria-hidden={true} width={80} height={80} />
              </Typography>
              <Typography sx={{ my: fr.spacing("2v"), fontSize: "40px", lineHeight: "48px", fontWeight: 700, color: "#0063CB" }}>20</Typography>
              <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
                demandes reçues en moyenne
                <br />
                par CFA sur une année
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#161616" }}>* Données calculées sur l'année 2025</Typography>
        </Box>

        <Grid
          container
          sx={{
            mt: fr.spacing("16v"),
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
            borderRadius: fr.spacing("2v"),
            padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
          }}
        >
          <Grid container display={"flex"} flexDirection={"row"} spacing={fr.spacing("4v")}>
            <Grid size={{ md: 6, xs: 12 }} sx={{ my: { md: "auto", xs: fr.spacing("4v") } }}>
              <Image
                fetchPriority="low"
                src={"/images/je-suis-cfa/illu-liste-offres.svg"}
                alt=""
                width={585}
                height={298}
                unoptimized
                style={{ width: "100%", height: "auto" }}
                aria-hidden={true}
              />
            </Grid>
            <Grid
              size={{ md: 6, xs: 12 }}
              sx={{ my: { md: "auto", xs: fr.spacing("4v") }, px: { md: fr.spacing("4v") } }}
              display={"flex"}
              flexDirection={"column"}
              gap={fr.spacing("4v")}
            >
              <Typography component={"h2"} variant={"h3"}>
                Développez et gérez vos entreprises partenaires
              </Typography>
              <Typography variant="body1" gutterBottom>
                3 étapes seulement pour mettre en ligne les besoins de vos entreprises partenaires. Vos offres regroupant formation et emploi seront mises en avant sur les
                différents sites.
              </Typography>
              <Typography variant="body1" gutterBottom>
                Recevez dans votre boîte mail des demandes de contact d’entreprises en recherche d’alternants.
              </Typography>
            </Grid>
          </Grid>
          <Grid container display={"flex"} flexDirection={{ md: "row", xs: "column-reverse" }} spacing={fr.spacing("4v")}>
            <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("4v") } }} display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")}>
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
                src={"/images/je-suis-cfa/illu-plateforme-jeunes.svg"}
                alt=""
                width={504}
                height={284}
                unoptimized
                style={{ width: "100%", height: "auto" }}
                aria-hidden={true}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid
          container
          sx={{
            mt: fr.spacing("16v"),
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
            borderRadius: fr.spacing("2v"),
            padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
          }}
          spacing={fr.spacing("12v")}
        >
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto" }}>
            <Image
              fetchPriority="low"
              src={"/images/je-suis-cfa/illu-carte-metiers.svg"}
              alt=""
              width={532}
              height={310}
              unoptimized
              style={{ width: "100%", height: "auto" }}
              aria-hidden={true}
            />
          </Grid>
          <Grid size={{ md: 6, xs: 12 }} sx={{ my: "auto", px: { md: fr.spacing("4v") } }} display="flex" flexDirection="column" gap={fr.spacing("4v")}>
            <Typography component={"h2"} variant={"h3"}>
              Accédez à la carte des métiers
            </Typography>
            <Typography variant="body1" gutterBottom>
              La carte d’étudiant des métiers ouvre droit à de nombreuses réductions pour vos alternants. Vous devez leur délivrer la carte dans les 30 jours qui suivent leur
              inscription.
            </Typography>
            <Box display={"flex"} flexDirection={{ md: "row", xs: "column" }} gap={fr.spacing("2v")} justifyContent={{ md: "start", xs: "center" }} textAlign={"center"}>
              {isCfaConnected ? (
                <Button
                  linkProps={{ href: PAGES.static.espaceProCfaCarteDEtudiantDesMetiers.getPath() }}
                  aria-label="Accéder à la carte des métiers"
                  priority="primary"
                  style={{ margin: "auto" }}
                >
                  Télécharger la carte des métiers
                </Button>
              ) : (
                <>
                  <Box>
                    <Button linkProps={{ href: PAGES.static.authentification.getPath() }} aria-label="Accéder à la page de connexion" priority="secondary">
                      Me connecter
                    </Button>
                  </Box>
                  <Box>
                    <Button linkProps={{ href: PAGES.static.espaceProCreationCfa.getPath() }} aria-label="Accéder à la page de création de compte" priority="secondary">
                      Me créer un compte
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </DefaultContainer>
      <Box sx={{ mt: { xs: fr.spacing("6v"), md: fr.spacing("20v") }, px: { xs: 0, lg: fr.spacing("6v") } }}>
        <DefaultContainer>
          <AppreciationUsagers realm="cfa" />
        </DefaultContainer>
      </Box>
    </Box>
  )
}

export default JeSuisCFAPage
