import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"
import { AUTHTYPE } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { AppreciationUsagers } from "@/app/(home)/_components/AppreciationUsagers"
import { StatCard } from "@/app/(landing-pages)/_components/StatCard"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { getDepotCtaHref } from "@/services/get-depot-cta-href"
import { getSession } from "@/utils/get-session"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

const greyBlockSx = {
  display: "flex",
  flexDirection: "column",
  gap: fr.spacing("8v"),
  backgroundColor: fr.colors.decisions.background.default.grey.hover,
  borderRadius: fr.spacing("2v"),
  padding: { md: fr.spacing("12v"), xs: fr.spacing("4v") },
} as const

const twoColumnsSx = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: fr.spacing("12v"), alignItems: "start" } as const

const featureSx = { display: "flex", flexDirection: "column", gap: fr.spacing("3v") } as const

const featureImageStyle = { width: "100%", maxWidth: "360px", height: "180px", objectFit: "contain", objectPosition: "left bottom" } as const

const PLATEFORMES_ORIENTATION = [
  { name: "Parcoursup", public: "Lycéens, étudiants", visiteurs: "424 000" },
  { name: "Mon Master", public: "Étudiants", visiteurs: "50 000" },
  { name: "Onisep", public: "Tous publics", visiteurs: "45 000" },
]

export const metadata: Metadata = METADATA.static.jeSuisCFA()

async function DepotCtaButtons() {
  const { user } = await getSession()
  const ctaDepotHref: string = getDepotCtaHref(user, "CFA")

  return (
    <Box display={"flex"} flexDirection={{ sm: "row", xs: "column" }} gap={fr.spacing("4v")}>
      <Button linkProps={{ href: ctaDepotHref }} priority="primary">
        Créer mon espace dédié
      </Button>
      <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
        Me connecter
      </Button>
    </Box>
  )
}

async function CarteMetiersCtaButtons() {
  const { user } = await getSession()
  const isCfaConnected = user && user.type === AUTHTYPE.CFA

  return (
    <Box display={"flex"} flexDirection={{ md: "row", xs: "column" }} gap={fr.spacing("2v")} justifyContent={{ md: "start", xs: "center" }} textAlign={"center"}>
      {isCfaConnected ? (
        <Button linkProps={{ href: PAGES.static.espaceProCfaCarteDEtudiantDesMetiers.getPath() }} priority="primary" style={{ margin: "auto" }}>
          Télécharger la carte des métiers
        </Button>
      ) : (
        <>
          <Box>
            {/* RGAA 6.1 : les intitulés visibles sont explicites, un aria-label ne ferait que
                remplacer le nom accessible par un texte qui ne les reprend pas. */}
            <Button linkProps={{ href: PAGES.static.authentification.getPath() }} priority="secondary">
              Me connecter
            </Button>
          </Box>
          <Box>
            <Button linkProps={{ href: PAGES.static.espaceProCreationCfa.getPath() }} priority="secondary">
              Me créer un compte
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}

const JeSuisCFAPage = () => {
  return (
    <Box
      sx={{
        mb: fr.spacing("6v"),
      }}
    >
      <SchemaOrg
        type="WebPage"
        title={METADATA.static.jeSuisCFA().title}
        description={METADATA.static.jeSuisCFA().description}
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
          >
            <Typography variant="h1" component="h1" gutterBottom color={fr.colors.decisions.text.title.blueFrance.default}>
              Vous êtes un organisme de formation
            </Typography>
            <Typography variant="h2" component="p" gutterBottom color={fr.colors.decisions.text.default.grey.default}>
              Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emploi
            </Typography>
            <Typography variant="body1" gutterBottom>
              Créez le compte de votre CFA pour diffuser les offres de vos entreprises partenaires, et recevoir les candidatures.{" "}
            </Typography>
            <Suspense fallback={<Box sx={{ height: 40 }} />}>
              <DepotCtaButtons />
            </Suspense>
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
        <Box component="section" aria-labelledby="bloc-formations" sx={{ ...greyBlockSx, mt: fr.spacing("16v") }}>
          <SectionTitle id="bloc-formations" variant="h2">
            Formations
          </SectionTitle>
          <Box sx={twoColumnsSx}>
            <Box sx={featureSx}>
              <Image fetchPriority="low" src="/images/je-suis-cfa/illu-rdv.svg" alt="" width={581} height={283} unoptimized style={featureImageStyle} />
              <Typography component="h3" variant="h5" sx={{ mb: 0 }}>
                Vos formations en alternance sont automatiquement exposées
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Pour référencer et mettre à jour vos formations sur La bonne alternance, nul besoin de vous créer un compte, il vous suffit de les déclarer auprès du Carif-Oref de
                votre région.
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Elles sont ensuite nationalement agrégées par le Réseau des Carif-Oref puis automatiquement exposées sur La bonne alternance.{" "}
                <DsfrLink href={PAGES.static.faq.getPath()}>
                  En savoir plus
                  <span className="fr-sr-only">{" - Consulter la foire aux questions"}</span>
                </DsfrLink>
              </Typography>
            </Box>
            <Box sx={featureSx}>
              <Image fetchPriority="low" src="/images/je-suis-cfa/illu-contact-candidat.svg" alt="" width={586} height={298} unoptimized style={featureImageStyle} />
              <Typography component="h3" variant="h5" sx={{ mb: 0 }}>
                Répondez facilement aux candidats intéressés par vos formations
              </Typography>
              <Typography sx={{ mb: 0 }}>
                Vous recevez directement dans votre boîte mail des demandes de candidats intéressés par vos formations et pouvez leur répondre en quelques clics.
              </Typography>
              <Typography variant="caption" component="p">
                *Vous pouvez à tout moment vous désinscrire de ce service en{" "}
                <DsfrLink href={PAGES.static.contact.getPath()}>
                  <Typography variant="caption">contactant notre équipe.</Typography>
                </DsfrLink>
              </Typography>
            </Box>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: fr.spacing("4v") }}>
            <StatCard icon="/images/home_pics/icons/ordi.svg" value="+ 52 000" label="formations exposées sur La bonne alternance" />
            <StatCard icon="/images/home_pics/icons/envelop.svg" value="+ 94 000" label="demandes envoyées par les candidats aux CFA" />
            <StatCard icon="/images/home_pics/icons/files.svg" value="16" label="demandes reçues en moyenne par CFA sur une année" />
          </Box>
          <Typography sx={{ mb: 0, fontSize: "12px", lineHeight: "20px" }}>* Données relevées sur l'année 2026, au 23 novembre 2026</Typography>
        </Box>

        <Box component="section" aria-labelledby="bloc-emplois" sx={{ ...greyBlockSx, mt: fr.spacing("16v") }}>
          <SectionTitle id="bloc-emplois" variant="h2">
            Emplois
          </SectionTitle>
          <Box sx={twoColumnsSx}>
            <Box sx={featureSx}>
              <Image fetchPriority="low" src="/images/je-suis-cfa/illu-liste-offres.svg" alt="" width={586} height={298} unoptimized style={featureImageStyle} />
              <Typography component="h3" variant="h5" sx={{ mb: 0 }}>
                Développez et gérez vos entreprises partenaires
              </Typography>
              <Typography sx={{ mb: 0 }}>
                3 étapes seulement pour mettre en ligne les besoins de vos entreprises partenaires. Vos offres regroupent formation et emploi et sont mises en avant sur les
                différents sites.
              </Typography>
              <Typography sx={{ mb: 0 }}>En parallèle, vous recevez dans votre boîte mail des demandes de contact d'entreprises intéressées par vos formations.</Typography>
            </Box>
            <Box sx={featureSx}>
              <Image fetchPriority="low" src="/images/je-suis-cfa/illu-plateforme-jeunes.svg" alt="" width={549} height={320} unoptimized style={featureImageStyle} />
              <Typography component="h3" variant="h5" sx={{ mb: 0 }}>
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
            </Box>
          </Box>
        </Box>

        <Box component="section" aria-labelledby="parcours-candidats" sx={{ mt: fr.spacing("16v"), display: "flex", flexDirection: "column", gap: fr.spacing("8v") }}>
          <SectionTitle id="parcours-candidats" highlight="dès leurs vœux d'orientation">
            Présents sur le parcours des candidats,
          </SectionTitle>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1.2fr)" }, gap: fr.spacing("12v"), alignItems: "start" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
              <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
                Un candidat qui choisit une formation en alternance doit trouver un employeur pour confirmer son inscription. Il a donc intérêt à chercher le plus tôt possible.
              </Typography>
              <Typography className={fr.cx("fr-text--lg")} sx={{ mb: 0 }}>
                C'est pourquoi La bonne alternance est intégrée aux plateformes d'orientation publiques. Les candidats découvrent les offres d'emploi en alternance au moment où ils
                formulent leurs vœux, et commencent leur recherche d'employeur avant la rentrée.
              </Typography>
              <Typography sx={{ mb: 0, fontSize: "24px", lineHeight: "32px", fontWeight: 700, color: fr.colors.decisions.text.title.blueFrance.default }}>
                11 % de nos visiteurs arrivent depuis ces plateformes
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
              <Box
                component="ul"
                sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: fr.spacing("4v") }}
              >
                {PLATEFORMES_ORIENTATION.map((plateforme) => (
                  <Box
                    component="li"
                    key={plateforme.name}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: fr.spacing("1v"),
                      p: fr.spacing("5v"),
                      backgroundColor: fr.colors.decisions.background.default.grey.default,
                      borderRadius: fr.spacing("1v"),
                      boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                    }}
                  >
                    <Typography component="h3" variant="h6" sx={{ mb: 0 }}>
                      {plateforme.name}
                    </Typography>
                    <Typography sx={{ mb: 0, fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.mention.grey.default }}>{plateforme.public}</Typography>
                    <Typography sx={{ mb: 0, fontSize: "24px", lineHeight: "32px", fontWeight: 700, color: "#0063CB" }}>{plateforme.visiteurs}</Typography>
                    <Typography sx={{ mb: 0 }}>visiteurs</Typography>
                  </Box>
                ))}
              </Box>
              <Typography sx={{ mb: 0, fontSize: "12px", lineHeight: "20px" }}>
                Visiteurs uniques de La bonne alternance venus de chaque plateforme, du 1er janvier au 9 octobre 2026.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          component="section"
          aria-labelledby="offres-qualite"
          sx={{
            mt: fr.spacing("12v"),
            p: { xs: fr.spacing("6v"), md: fr.spacing("8v") },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: fr.spacing("8v"),
            alignItems: "center",
            backgroundColor: fr.colors.decisions.background.default.grey.default,
            borderRadius: fr.spacing("2v"),
            boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
            <Typography id="offres-qualite" component="h2" variant="h4" sx={{ mb: 0 }}>
              La bonne alternance garantit des offres de qualité pour vos alternants
            </Typography>
            <Typography sx={{ mb: 0 }}>
              Chaque offre est vérifiée avant publication. Nous écartons notamment les annonces qui présentent une formation comme une offre d'emploi. Les offres que vous publiez
              pour vos entreprises partenaires sont contrôlées de la même façon : ainsi vous gagnez en crédibilité auprès des candidats.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
            <Typography component="p" sx={{ mb: 0, fontSize: "24px", lineHeight: "32px", fontWeight: 700, color: "#0063CB" }}>
              1 sur 5
            </Typography>
            <Typography sx={{ mb: 0 }}>
              offre partenaire écartée par nos contrôles
              <br />
              entre février 2025 et octobre 2026
            </Typography>
            <Image
              fetchPriority="low"
              src="/images/service-public/offres-qualite.png"
              alt=""
              width={550}
              height={322}
              style={{ width: "210px", maxWidth: "100%", height: "auto" }}
            />
          </Box>
        </Box>

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
            <Suspense fallback={<Box sx={{ height: 40 }} />}>
              <CarteMetiersCtaButtons />
            </Suspense>
          </Grid>
        </Grid>
      </DefaultContainer>
      <Box sx={{ mt: { xs: fr.spacing("6v"), md: fr.spacing("20v") }, px: { xs: 0, lg: fr.spacing("6v") } }}>
        <DefaultContainer>
          <AppreciationUsagers realm="cfa" />
        </DefaultContainer>
      </Box>
      <DefaultContainer>
        <FollowLinkedIn />
      </DefaultContainer>
    </Box>
  )
}

export default JeSuisCFAPage
