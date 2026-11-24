import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { AppreciationUsagers } from "@/app/(home)/_components/AppreciationUsagers"
import { GrandsGroupesRecruteur } from "@/app/(home)/_components/GrandsGroupesRecruteur"
import { StatCard } from "@/app/(landing-pages)/_components/StatCard"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { SchemaOrg } from "@/components/SchemaOrg"
import { getDepotCtaHref } from "@/services/get-depot-cta-href"
import { getSession } from "@/utils/get-session"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

const featureImageStyle = { width: "100%", maxWidth: "280px", height: "160px", objectFit: "contain", objectPosition: "left bottom" } as const

export const metadata: Metadata = METADATA.static.jeSuisRecruteur()

async function DepotCtaButtons() {
  const { user } = await getSession()
  const ctaDepotHref: string = getDepotCtaHref(user, "ENTREPRISE")

  return (
    <Box display={"flex"} flexDirection={{ sm: "row", xs: "column" }} gap={fr.spacing("4v")}>
      <Button linkProps={{ href: ctaDepotHref }} priority="primary">
        Déposer une offre
      </Button>
      <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
        Me connecter
      </Button>
    </Box>
  )
}

const JeSuisRecruteurPage = () => {
  return (
    <>
      <Box
        sx={{
          mb: fr.spacing("6v"),
        }}
      >
        <SchemaOrg
          type="WebPage"
          title={METADATA.static.jeSuisRecruteur().title}
          description={METADATA.static.jeSuisRecruteur().description}
          url={PAGES.static.jeSuisRecruteur.getPath()}
          breadcrumbs={[
            { name: PAGES.static.home.title, url: PAGES.static.home.getPath() },
            { name: PAGES.static.jeSuisRecruteur.title, url: PAGES.static.jeSuisRecruteur.getPath() },
          ]}
        />
        <Breadcrumb pages={[PAGES.static.jeSuisRecruteur]} />
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
              <Typography variant="h2" component="p" gutterBottom color={fr.colors.decisions.text.default.grey.default}>
                Diffusez gratuitement vos offres en alternance sur le service public de l'alternance
              </Typography>
              <Typography variant="body1" gutterBottom>
                Exprimez votre besoin en moins d'une minute. Votre offre est vérifiée, puis visible sur La bonne alternance et chez nos partenaires, auprès des candidats et des
                centres de formation proches de vous.
              </Typography>
              <Suspense fallback={<Box sx={{ height: 40 }} />}>
                <DepotCtaButtons />
              </Suspense>
            </Grid>
            <Grid size={6} display={{ md: "flex", xs: "none" }} flexDirection={"column"} justifyContent={"center"}>
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
          <Box
            component="section"
            aria-label="Fonctionnalités"
            sx={{
              mt: fr.spacing("8v"),
              backgroundColor: fr.colors.decisions.background.default.grey.hover,
              borderRadius: fr.spacing("2v"),
              padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: fr.spacing("8v"),
              alignItems: "start",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              <Typography component="h2" variant="h6" sx={{ mb: 0 }}>
                Postez votre offre d’alternance en quelques secondes
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans votre compte en vous connectant avec votre email
                uniquement.
              </Typography>
              <Image fetchPriority="low" src="/images/je-suis-recruteur/illu-offre-emploi.svg" alt="" width={575} height={280} unoptimized style={featureImageStyle} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              <Typography component="h2" variant="h6" sx={{ mb: 0 }}>
                Vos offres sont diffusées gratuitement au plus près des candidats
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
                <DsfrLink href={PAGES.static.home.getPath()}>La bonne alternance</DsfrLink>, <DsfrLink href="https://www.francetravail.fr/accueil/">France Travail</DsfrLink>,{" "}
                <DsfrLink href="https://parcoursup.fr">Parcoursup</DsfrLink>, <DsfrLink href="https://www.hellowork.com">HelloWork</DsfrLink> et{" "}
                <DsfrLink href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1">
                  bien d’autres
                  <span className="fr-sr-only">{" - Consulter les autres partenaires de La bonne alternance"}</span>
                </DsfrLink>
                .
              </Typography>
              <Image fetchPriority="low" src="/images/je-suis-recruteur/illu-plateforme-jeunes.svg" alt="" width={549} height={320} unoptimized style={featureImageStyle} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              <Typography component="h2" variant="h6" sx={{ mb: 0 }}>
                Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin d’accélérer vos recrutements.
              </Typography>
              <Image fetchPriority="low" src="/images/je-suis-recruteur/illu-soliciter-cfa.svg" alt="" width={543} height={372} unoptimized style={featureImageStyle} />
            </Box>
          </Box>

          <Box
            component="section"
            aria-labelledby="toutes-les-entreprises"
            sx={{ mt: { xs: fr.spacing("10v"), md: fr.spacing("16v") }, display: "flex", flexDirection: "column", gap: fr.spacing("8v") }}
          >
            <SectionTitle id="toutes-les-entreprises" highlight="surtout les plus petites">
              Pensé pour toutes les entreprises
            </SectionTitle>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: fr.spacing("12v"), alignItems: "start" }}>
              <Box>
                <Typography className={fr.cx("fr-text--lg")}>
                  Beaucoup d'entreprises n'ont pas d'équipe dédiée au recrutement. La bonne alternance vous permet de publier une offre simplement et gratuitement. Et même sans
                  offre publiée, des candidats peuvent vous contacter directement.
                </Typography>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
                  {["Un dépôt d'offre en moins d'une minute", "Des candidatures reçues par mail", "Une mise en relation avec les écoles qui forment sur vos métiers"].map(
                    (item) => (
                      <Box component="li" key={item} sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-start", fontWeight: 700 }}>
                        <span className={fr.cx("fr-icon-check-line")} aria-hidden="true" style={{ color: fr.colors.decisions.text.title.blueFrance.default }} />
                        {item}
                      </Box>
                    )
                  )}
                </Box>
              </Box>
              <Box>
                <Box
                  component="ul"
                  sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: fr.spacing("4v") }}
                >
                  <StatCard
                    layout="row"
                    icon="/images/home_pics/icons/file_eyes.svg"
                    value="113"
                    label="consultations par offre"
                    source="(moyenne calculée sur les offres La bonne alternance entre janvier et novembre 2026)"
                  />
                  <StatCard
                    layout="row"
                    icon="/images/home_pics/icons/files.svg"
                    value="23"
                    label="candidatures par offre"
                    source="(moyenne calculée sur les offres La bonne alternance entre janvier et novembre 2026)"
                  />
                  <StatCard
                    layout="row"
                    icon="/images/home_pics/icons/malette.svg"
                    value="389 000"
                    label="offres en alternance collectées en 2026"
                    source="(année partielle, donnée établie au 23/11/2026)"
                  />
                  <StatCard
                    layout="row"
                    icon="/images/home_pics/icons/contrat.png"
                    value="9 sur 10"
                    label="entreprises qui ont recruté un alternant grâce à La bonne alternance en 2026 sont des TPE ou des PME"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            component="section"
            aria-labelledby="marche-cache"
            sx={{
              mt: { md: fr.spacing("16v"), xs: fr.spacing("10v") },
              backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
              borderRadius: fr.spacing("2v"),
              padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" },
              gap: { md: fr.spacing("12v"), xs: fr.spacing("6v") },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
              <SectionTitle id="marche-cache" variant="h2" highlight="Les candidats peuvent quand même vous trouver">
                Pas d'offre publiée ?
              </SectionTitle>
              <Typography sx={{ mb: 0 }}>
                Une grande partie des recrutements en alternance se fait sans offre publiée. Ce marché caché profite surtout aux candidats qui ont du réseau. Pour l'ouvrir à tous,
                La bonne alternance montre aux candidats deux types d'opportunités :
              </Typography>
              <Box component="ul" sx={{ listStyleType: "disc", pl: fr.spacing("6v"), m: 0, display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
                <li>
                  <span className="fr-text--bold">Les offres d'emploi</span> <TagOffreEmploi />, déposées par les recruteurs ou issues de nos partenaires.
                </li>
                <li>
                  <span className="fr-text--bold">Les entreprises à fort potentiel d'embauche</span> <TagCandidatureSpontanee />. Chaque mois, La bonne alternance identifie des
                  entreprises à fort potentiel d'embauche en alternance grâce à l'analyse de diverses données, pour repérer les entreprises susceptibles de recruter un alternant
                  dans les 6 prochains mois, y compris celles qui ne l'ont jamais fait.
                </li>
              </Box>
              <Typography sx={{ mb: 0 }}>Votre entreprise fait partie de la liste ? Vous recevez des candidatures spontanées ciblées, sans rien publier.</Typography>
              <Box>
                <DsfrLink href={PAGES.static.desinscription.getPath()} arrow="right">
                  Je ne souhaite plus recevoir de candidature spontanée
                </DsfrLink>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <Image
                fetchPriority="low"
                src="/images/je-suis-recruteur/illu-marche-cache.svg"
                alt=""
                width={506}
                height={618}
                unoptimized
                style={{ width: "100%", maxWidth: "380px", height: "auto" }}
              />
            </Box>
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
                  linkProps={{ href: `${PAGES.static.guideDecouvrirLAlternance.getPath()}?guide_source=guide-recruteur` }}
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
          <FollowLinkedIn />
        </DefaultContainer>
      </Box>
    </>
  )
}

export default JeSuisRecruteurPage
