import { fr } from "@codegouvfr/react-dsfr"
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import NextLink from "next/link"
import type { ReactNode } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { BarChartHorizontal } from "./_components/BarChartHorizontal"
import { BarometreHero } from "./_components/BarometreHero"
import { CompositionBars } from "./_components/CompositionBars"
import { RegionsMap } from "./_components/RegionsMap"
import { ShareBar } from "./_components/ShareBar"
import {
  BAROMETRE_FAQ,
  BAROMETRE_KEYWORDS,
  clicsParNiveau,
  clicsParTaille,
  clicsParType,
  clicsSeries,
  metiersLesMoinsSollicites,
  metiersLesPlusSollicites,
  opportunitesParNiveau,
  opportunitesParTaille,
  opportunitesSeries,
  PUBLISHED_DATE,
  PUBLISHED_LABEL,
  ratioClasses,
  ratioParRegion,
  usageMetrics,
} from "./_data/t3-2026"

export const metadata: Metadata = {
  ...METADATA.static.barometre(),
  alternates: {
    canonical: PAGES.static.barometre.getPath(),
  },
}

const paragraphSx = { mb: fr.spacing("4v"), maxWidth: "72ch", fontSize: "17px", lineHeight: "28px", color: fr.colors.decisions.text.default.grey.default } as const

const sectionTitleSx = {
  mt: { xs: fr.spacing("12v"), md: fr.spacing("16v") },
  mb: fr.spacing("5v"),
  fontWeight: 700,
  fontSize: { xs: "28px", md: "32px" },
  lineHeight: { xs: "36px", md: "40px" },
  color: fr.colors.decisions.text.title.grey.default,
} as const

const leverTitleSx = {
  mt: fr.spacing("8v"),
  mb: fr.spacing("2v"),
  fontWeight: 700,
  fontSize: "20px",
  lineHeight: "28px",
  color: fr.colors.decisions.text.title.grey.default,
} as const

const twoChartsSx = { display: "grid", gap: fr.spacing("6v"), gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } } as const

const P = ({ children }: { children: ReactNode }) => (
  <Typography component="p" sx={paragraphSx}>
    {children}
  </Typography>
)

const Note = ({ children }: { children: ReactNode }) => (
  <Typography component="p" sx={{ ...paragraphSx, fontSize: "14px", lineHeight: "22px", fontStyle: "italic", color: fr.colors.decisions.text.mention.grey.default }}>
    {children}
  </Typography>
)

const LBA_URL = `${PAGES.static.home.getPath()}?utm_source=lba&utm_medium=web&utm_campaign=lba_barometre_t2-t3-2026`
const PARTNERS_URL = "https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"

const Lba = () => <NextLink href={LBA_URL}>La bonne alternance</NextLink>

export default function BarometrePage() {
  return (
    <Box>
      <SchemaOrg
        type="Article"
        title={METADATA.static.barometre().title as string}
        description={METADATA.static.barometre().description as string}
        url={PAGES.static.barometre.getPath()}
        breadcrumbs={[
          { name: "Accueil", url: PAGES.static.home.getPath() },
          { name: PAGES.static.barometre.title, url: PAGES.static.barometre.getPath() },
        ]}
        datePublished={PUBLISHED_DATE}
        dateModified={PUBLISHED_DATE}
        articleSection="Marché de l’alternance"
        keywords={BAROMETRE_KEYWORDS}
        faqItems={BAROMETRE_FAQ}
      />

      <Breadcrumb pages={[PAGES.static.barometre]} />

      <BarometreHero
        title="Le marché de l’alternance vu par ses usagers : baromètre La bonne alternance T2-T3 2026"
        published={PUBLISHED_LABEL}
        metrics={usageMetrics}
        periodLabels={["T2+T3 2025", "T2+T3 2026"]}
        chartTitle="Usage du service, d’avril à septembre"
      >
        <Typography component="p">
          Chaque mois, 500&nbsp;000 usagers candidats, recruteurs et organismes de formations utilisent le service gouvernemental <Lba /> pour concrétiser leur projet d’alternance.
        </Typography>
        <Typography component="p">
          Ce volume d’utilisation permet d’observer de près ce que cherchent les candidats et ce dont les entreprises ont besoin. Ce baromètre partage ces observations avec
          l’ensemble de l’écosystème avec un objectif&nbsp;: identifier des leviers concrets qui faciliteront les entrées en alternance futures.
        </Typography>
        <Typography component="p">
          <Lba /> s’empare également de ces observations pour orienter ses prochaines évolutions, présentées en fin de baromètre.
        </Typography>
      </BarometreHero>

      <DefaultContainer>
        <Grid container>
          <Grid size={{ md: 1, xs: 0 }} />
          <Grid size={{ md: 10, xs: 12 }}>
            <Box component="article" sx={{ pb: fr.spacing("16v") }}>
              <Typography component="h2" sx={sectionTitleSx}>
                Une audience qui donne à voir le marché
              </Typography>

              <P>
                Depuis janvier 2026, près de 5 millions de personnes ont utilisé le service <Lba />. Sur les deuxième et troisième trimestres de l’année, période couverte par ce
                baromètre, la fréquentation a fortement augmenté par rapport à 2025&nbsp;: +66&nbsp;% de visiteurs, +56&nbsp;% de candidats et +156&nbsp;% de candidatures envoyées.
              </P>
              <P>
                Si les candidats sont toujours plus nombreux, c’est notamment parce que <Lba /> rassemble en un seul endroit l’ensemble des emplois en alternance, avec près de
                500&nbsp;000 opportunités d’emploi en alternance exposées sur des deuxième et troisième trimestres 2026.
              </P>
              <P>
                Le service <Lba /> centralise en effet des offres d’emploi collectées directement auprès des recruteurs, des offres agrégées d’autres plateformes (Hellowork,
                Meteojob, LinkedIn, Leboncoin, France Travail et <DsfrLink href={PARTNERS_URL}>bien d’autres</DsfrLink>) ainsi que des entreprises auprès desquelles adresser des
                candidatures spontanées.
              </P>
              <P>Les candidats, guidés tout au long de leur parcours, s’approprient cette diversité comme en témoigne le graphique ci-dessous.</P>

              <ShareBar
                title="Intentions de candidature par type d’opportunité"
                caption="D’avril à septembre 2026, 2 532 230 intentions de candidature sur 468 911 offres publiées"
                items={clicsParType}
              />

              <P>
                L’usage croissant du service reflète notamment un attrait persistant des jeunes pour la voie de l’alternance, qui agit comme un tremplin vers l’emploi. Pourtant, le
                nombre de contrats signés en alternance recule.
              </P>
              <P>Plus de candidats sur le service, moins de contrats signés&nbsp;: un décalage au cœur de ce baromètre, qui touche de manière inégale acteurs et secteurs.</P>

              <Typography component="h2" sx={sectionTitleSx}>
                Un accompagnement au plus près des besoins
              </Typography>

              <P>
                Côté employeur, 70&nbsp;% des contrats en alternance démarrés au cours des douze derniers mois l’ont été dans des petites et moyennes entreprises (source&nbsp;:
                base DECA). Pourtant, recruter un alternant ne demande pas les mêmes efforts à une petite entreprise, peu connue et sans service RH, qu’à un grand groupe, reconnu
                et structuré.
              </P>
              <P>Les petites et moyennes entreprises recrutent, mais publient rarement des offres. Leurs besoins en recrutement sont ainsi peu visibles, peu accessibles.</P>
              <P>
                Dans le cadre de sa mission de service public, <Lba /> identifie les entreprises qui ont un fort potentiel d’embauche et les rend visibles auprès des candidats, qui
                peuvent leur adresser une candidature spontanée. Il s’agit presque toujours de petites et moyennes entreprises, qui accèdent ainsi à des candidats qu’elles
                n’auraient pas touchés autrement.
              </P>
              <P>
                Le service collecte également des offres directement auprès des recruteurs, qui les publient gratuitement. Là encore, les petites structures sont les premières à
                s’en saisir&nbsp;: la grande majorité de ces offres émanent d’entreprises de moins de 250 salariés.
              </P>
              <P>
                Les offres d’emploi agrégées de sites partenaires, davantage tournées vers les grandes entreprises, complètent cet éventail et élargissent le choix des candidats.
              </P>
              <P>Le graphique qui suit détaille la répartition des opportunités d’emploi selon la taille de l’entreprise et leur provenance.</P>

              <CompositionBars
                title="Opportunités par type et par taille d’entreprise"
                caption="D’avril à septembre 2026, 321 886 opportunités dont la taille d’entreprise est connue"
                series={opportunitesSeries}
                rows={opportunitesParTaille}
                note="TPE = Très petites entreprises (1 à 9 salariés), PME = Petites et moyennes entreprises (10 à 249 salariés), ETI et GE = Entreprises de taille intermédiaire et Grandes entreprises (+250 salariés)"
              />

              <P>
                Les candidats se saisissent largement de cette diversité d’opportunités. La candidature spontanée est de loin le premier canal de mise en relation avec les petites
                et moyennes entreprises.
              </P>

              <CompositionBars
                title="Intentions de candidature par taille d’entreprise"
                caption="D’avril à septembre 2026, 1 703 874 intentions de candidature vers des entreprises dont la taille est connue"
                series={clicsSeries}
                rows={clicsParTaille}
              />

              <P>
                Côté candidats, l’apprentissage ouvre plus largement les portes de l’emploi, en particulier pour les jeunes les moins diplômés (source&nbsp;:{" "}
                <DsfrLink href="https://www.education.gouv.fr/depp/insertion-professionnelle-des-apprentis-de-niveau-cap-bts-six-mois-apres-leur-sortie-d-etudes-en-468269">
                  DEPP, 2025
                </DsfrLink>
                ). Ces jeunes, qui débutent et ont rarement un réseau professionnel, sont pourtant ceux pour qui l’accès à l’emploi reste le plus difficile (source&nbsp;:{" "}
                <DsfrLink href="https://www.insee.fr/fr/statistiques/8305552?sommaire=8306008">Insee, 2025</DsfrLink>
                ).
              </P>
              <P>
                <Lba /> leur ouvre largement ses portes&nbsp;: près d’une offre sur deux dont le niveau de diplôme est connu est accessible avec un CAP ou un bac.
              </P>

              <CompositionBars
                title="Offres par type et par niveau de diplôme demandé"
                caption="D’avril à septembre 2026, 81 522 offres dont le niveau de diplôme est connu"
                series={opportunitesSeries.slice(0, 2)}
                rows={opportunitesParNiveau}
              />

              <Note>
                Note&nbsp;: les niveaux de diplôme recherchés par les recruteurs ne sont pas disponibles pour les candidatures spontanées (soit 80&nbsp;% des candidatures).
              </Note>

              <P>
                Ces opportunités restent pourtant moins sollicitées. Ainsi, une offre de niveau CAP attire en moyenne trois fois moins de candidats qu’une offre de niveau bac+2.
                Mieux les faire connaître est un enjeu fort pour le service.
              </P>

              <CompositionBars
                title="Intentions de candidature par niveau de diplôme demandé"
                caption="D’avril à septembre 2026, 644 014 intentions de candidature sur des offres dont le niveau de diplôme est connu"
                series={clicsSeries.slice(1)}
                rows={clicsParNiveau}
              />

              <Typography component="h2" sx={sectionTitleSx}>
                Une demande qui ne rejoint pas toujours l’offre
              </Typography>

              <P>Au-delà de la taille des entreprises et du niveau de diplôme préparé, les écarts entre candidats et recruteurs se lisent aussi par métier et territoire.</P>
              <P>
                Sur <Lba />, une offre suscite en moyenne six intentions de candidature. Derrière cette moyenne, les situations sont très contrastées. Certains métiers, dans le
                numérique notamment, attirent plus de vingt candidats par offre&nbsp;: la concurrence y est vive. À l’inverse, des métiers de l’aide à la personne, du bâtiment ou
                de l’industrie peinent à dépasser une candidature par offre, alors même que de nombreuses entreprises y recrutent.
              </P>
              <P>
                Pour illustrer ces propos, le graphique suivant s’attache à détailler les plus forts déséquilibres observés entre candidatures reçues et offres disponibles sur{" "}
                <Lba />.
              </P>

              <Box sx={twoChartsSx}>
                <BarChartHorizontal
                  title="Les 10 métiers les plus sollicités"
                  caption="Intentions de candidature par offre"
                  items={metiersLesPlusSollicites}
                  tone="contrast"
                  maxValue={43}
                />
                <BarChartHorizontal
                  title="Les 10 métiers les moins sollicités"
                  caption="Intentions de candidature par offre, même échelle"
                  items={metiersLesMoinsSollicites}
                  tone="info"
                  maxValue={43}
                />
              </Box>

              <Note>
                Note&nbsp;: Seuil de significativité&nbsp;: un métier est éligible au classement s’il compte au moins 100 offres ET au moins 500 intentions de candidature sur la
                période (93 métiers éligibles en T2+T3 2026).
              </Note>

              <P>La plupart de ces métiers peu sollicités sont accessibles dès le CAP. Ils offrent de réelles perspectives aux candidats qui cherchent un premier contrat.</P>
              <P>
                Les déséquilibres observés varient également selon les régions. Sans surprise, l’Île-de-France se distingue nettement. Chaque offre y attire en moyenne plus de huit
                candidats. À l’inverse, en Bretagne, en Corse et dans plusieurs territoires d’outre-mer (Guyane, Martinique, Guadeloupe), les offres sont deux à six fois moins
                sollicitées. Dans ces territoires, les entreprises ont plus de mal à trouver des candidats.
              </P>

              <RegionsMap
                title="Intentions de candidature par offre, par région"
                caption="D’avril à septembre 2026, moyenne nationale : 5,4"
                mapLabel="Carte de France des régions : l’Île-de-France compte 8,5 intentions de candidature par offre, la Corse 0,9. Le détail figure dans les listes voisines."
                regions={ratioParRegion}
                classes={ratioClasses}
                topTitle="Les 5 régions où les offres sont les plus sollicitées"
                flopTitle="Les 5 régions où les offres sont les moins sollicitées"
                note="Collectivités d’outre-mer : 3,2 intentions de candidature par offre (13 intentions pour 4 offres), non représentées sur la carte."
              />

              <P>Ces écarts traduisent un décalage net entre les souhaits d’orientation des candidats à l’alternance et les besoins en recrutement des entreprises.</P>
              <P>Les observer permet de les comprendre. Les comprendre permet d’agir.</P>
              <P>
                Mieux informer les candidats, ouvrir leurs recherches à des métiers qui recrutent, valoriser les entreprises qui peinent à recruter&nbsp;: c’est sur ces leviers que{" "}
                <Lba /> concentre son action.
              </P>

              <Typography component="h2" sx={sectionTitleSx}>
                Des leviers pour rapprocher candidats et entreprises
              </Typography>

              <P>
                En tant que service public, <Lba /> soutient le recours à l’alternance comme tremplin vers un emploi durable. Différents leviers, en place ou à venir, servent cet
                objectif.
              </P>

              <Typography component="h3" sx={leverTitleSx}>
                Ouvrir les recherches au-delà des offres publiées
              </Typography>
              <P>
                Plus de la moitié des recrutements, en alternance comme ailleurs, se fait sans qu’aucune offre d’emploi n’ait été diffusée. <Lba /> identifie les entreprises qui
                recrutent sans publier d’offre, les rend visibles et permet aux candidats de leur adresser une candidature spontanée.
              </P>
              <P>Ce levier est aujourd’hui largement adopté&nbsp;: 3 candidatures sur 4 envoyées via le service sont spontanées.</P>

              <Typography component="h3" sx={leverTitleSx}>
                Faire connaître les opportunités accessibles dès le CAP
              </Typography>
              <P>
                Les offres d’emploi en alternance liées aux diplômes du secondaire sont nombreuses mais encore peu sollicitées, alors que c’est à ces niveaux de diplôme que
                l’alternance a le plus grand impact sur l’insertion durable. Le service souhaite poursuivre ses actions de collecte et de mise en avant de ces opportunités auprès
                des publics concernés, au plus tôt dans leur parcours de recherche d’alternance.
              </P>

              <Typography component="h3" sx={leverTitleSx}>
                Mieux informer les candidats sur les métiers qui recrutent
              </Typography>
              <P>
                Une expérimentation visant à valoriser des filières d’avenir, qui recrutent dès maintenant, est en cours de mise en place sur le service <Lba />. Les candidats
                pourront découvrir ces métiers et les opportunités disponibles afin, s’ils le souhaitent, d’y postuler.
              </P>
              <P>
                Si l’expérimentation se montre concluante, elle sera étendue à un plus grand nombre de filières. La valorisation de ces filières pourra en outre être renforcée,
                notamment auprès des candidats qui se tournent vers des métiers très demandés.
              </P>

              <Box
                component="section"
                aria-labelledby="barometre-agir-ensemble"
                sx={{
                  mt: { xs: fr.spacing("12v"), md: fr.spacing("16v") },
                  p: { xs: fr.spacing("6v"), md: fr.spacing("10v") },
                  backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                  borderTop: `4px solid ${fr.colors.decisions.border.plain.blueFrance.default}`,
                }}
              >
                <Typography id="barometre-agir-ensemble" component="h2" sx={{ ...sectionTitleSx, mt: 0, color: fr.colors.decisions.text.title.blueFrance.default }}>
                  Agir ensemble pour faciliter les entrées en alternance
                </Typography>
                <P>
                  Dans un contexte de recul des contrats signés, chaque mise en relation compte. En particulier pour les candidats et entreprises ayant le plus de difficultés à se
                  trouver. Ce baromètre met en lumière des principaux décalages entre candidats et recruteurs observés sur <Lba /> qui caractérisent l’état actuel du marché.
                </P>

                <Typography component="h3" sx={leverTitleSx}>
                  Entreprises
                </Typography>
                <P>Vous souhaitez recruter un alternant mais peinez à trouver des candidats&nbsp;? Publiez gratuitement votre offre ou contactez notre équipe.</P>
                <ButtonsGroup
                  inlineLayoutWhen="md and up"
                  buttons={[
                    { children: "Publier gratuitement une offre", linkProps: { href: PAGES.static.accesRecruteur.getPath() } },
                    { children: "Contacter l’équipe", priority: "secondary", linkProps: { href: PAGES.static.contact.getPath() } },
                  ]}
                />

                <Typography component="h3" sx={leverTitleSx}>
                  CFA, prescripteurs, partenaires et plateformes
                </Typography>
                <P>
                  Les données de <Lba /> sont ouvertes et accessibles sur <DsfrLink href="https://api.apprentissage.beta.gouv.fr/">api.apprentissage.beta.gouv.fr</DsfrLink>.
                  Rejoignez les plus de 300 organisations qui les utilisent déjà pour accompagner les candidats à l’alternance.
                </P>

                <P>Rendez-vous dans une prochaine édition pour mesurer les premiers effets de ces actions.</P>
                <DsfrLink href={PAGES.static.barometreT1.getPath()} arrow="right">
                  Consulter le baromètre du premier trimestre 2026
                </DsfrLink>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}
