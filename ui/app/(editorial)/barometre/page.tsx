import { fr } from "@codegouvfr/react-dsfr"
import { Highlight } from "@codegouvfr/react-dsfr/Highlight"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { SchemaOrg } from "@/components/SchemaOrg"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
import { BarChartHorizontal } from "./_components/BarChartHorizontal"
import { BarChartVertical } from "./_components/BarChartVertical"
import { BarometreHero } from "./_components/BarometreHero"
import { ChartFrame } from "./_components/ChartFrame"
import { Insight } from "./_components/Insight"
import { MetiersMosaic } from "./_components/MetiersMosaic"
import { PictoRanking } from "./_components/PictoRanking"
import { RegionsMap } from "./_components/RegionsMap"
import { ShareBar } from "./_components/ShareBar"
import {
  BAROMETRE_FAQ,
  BAROMETRE_KEYWORDS,
  candidaturesHero,
  candidaturesParType,
  candidaturesParTypeLegend,
  flopMetiersCandidats,
  flopRegionsCandidatures,
  flopRegionsOffres,
  niveauDiplome,
  PUBLISHED_DATE,
  secteursMoinsSousTension,
  secteursSousTension,
  topMetiersCandidats,
  topMetiersRecruteurs,
  topRegionsCandidatures,
  topRegionsOffres,
  topSecteursRecruteurs,
  topSecteursSpontanees,
} from "./_data/t3-2026"

export const metadata: Metadata = {
  ...METADATA.static.barometre(),
  alternates: {
    canonical: PAGES.static.barometre.getPath(),
  },
}

const positive = (s: string) => (
  <Typography component="span" sx={{ color: fr.colors.decisions.text.default.success.default, fontWeight: 700 }}>
    {s}
  </Typography>
)
const strong = (s: string) => (
  <Typography component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.title.grey.default }}>
    {s}
  </Typography>
)
const italic = (s: string) => (
  <Typography component="span" sx={{ fontStyle: "italic" }}>
    {s}
  </Typography>
)

const subSectionTitleSx = {
  mt: fr.spacing("8v"),
  mb: fr.spacing("3v"),
  color: fr.colors.decisions.text.title.grey.default,
  fontWeight: 700,
} as const

const paragraphSx = { mb: fr.spacing("3v"), maxWidth: "72ch", color: fr.colors.decisions.text.default.grey.default } as const

const sectionTitleSx = {
  mt: { xs: fr.spacing("12v"), md: fr.spacing("16v") },
  mb: fr.spacing("4v"),
  fontWeight: 700,
  fontSize: { xs: "28px", md: "32px" },
  lineHeight: { xs: "36px", md: "40px" },
  maxWidth: "26em",
  color: fr.colors.decisions.text.title.grey.default,
} as const

const TAKEAWAYS = [
  { title: "Un service de plus en plus utilisé", text: "Le nombre de candidatures a doublé en un an, avec environ 707 000 candidatures au 3e trimestre." },
  {
    title: "Un déséquilibre structurel",
    text: "Les candidatures se concentrent sur les fonctions support et tertiaires, alors que les offres restent portées par la restauration et le commerce.",
  },
  { title: "76 % de candidatures spontanées", text: "La bonne alternance permet aux candidats d’aller chercher le marché caché là où les offres ne suffisent plus." },
]

const twoChartsSx = { display: "grid", gap: fr.spacing("4v"), gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } } as const

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
        title="La dynamique de l’alternance au 3e trimestre 2026 sur La bonne alternance"
        published="Publié le 2 novembre 2026"
        bars={candidaturesHero}
        chartLabel="Candidatures par trimestre : 299 741 au T1 2025, 311 520 au T2 2025, 337 928 au T3 2025, 193 024 au T4 2025, 319 768 au T1 2026, 675 719 au T2 2026 et 707 059 au T3 2026, soit +109 % en un an."
      />

      <DefaultContainer>
        <Box component="article" sx={{ pb: fr.spacing("16v") }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" },
              gap: { xs: fr.spacing("6v"), md: fr.spacing("8v") },
              pt: fr.spacing("10v"),
            }}
          >
            {TAKEAWAYS.map((takeaway) => (
              <Box key={takeaway.title}>
                <Typography component="p" sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "28px", mb: fr.spacing("2v"), color: fr.colors.decisions.text.title.grey.default }}>
                  {takeaway.title}
                </Typography>
                <Typography component="p" sx={{ m: 0, color: fr.colors.decisions.text.default.grey.default }}>
                  {takeaway.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography component="p" sx={{ mt: fr.spacing("6v"), mb: 0, maxWidth: "90ch", fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default }}>
            Les données présentées dans ce baromètre sont issues exclusivement de La bonne alternance et reflètent l’activité observée sur la plateforme. Elles ne constituent pas
            un indicateur exhaustif du marché de l’alternance.
          </Typography>

          <Grid container>
            <Grid size={{ md: 1, xs: 0 }} />
            <Grid size={{ md: 10, xs: 12 }}>
              <Typography component="h2" sx={sectionTitleSx}>
                Un aperçu des offres de recrutement sur La bonne alternance
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Le 3e trimestre 2026 confirme la place notable de la restauration et du commerce dans le stock d’offres sur La bonne alternance, tout en révélant une
                diversification progressive vers le tertiaire et les services.
              </Typography>

              <Box sx={twoChartsSx}>
                <BarChartHorizontal title="Les 10 métiers les plus recherchés" caption="Part des offres" items={topMetiersRecruteurs} tone="info" />
                <BarChartHorizontal title="Les 10 secteurs les plus représentés" caption="Part des offres" items={topSecteursRecruteurs} tone="info" />
              </Box>

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  La restauration traditionnelle et rapide restent en tête du stock d’offres ({strong("12,5 %")} à elles deux), confirmant leur rôle de premier employeur en
                  alternance sur la plateforme. Mais la présence des sièges sociaux (3,8 %), du conseil (3,4 %), de la comptabilité (2,7 %) et du conseil informatique (1,5 %) dans
                  le top 10 traduit une diversification réelle&nbsp;: la plateforme attire désormais des recruteurs au-delà des secteurs traditionnellement dominants.
                </Typography>
              </Insight>

              <Typography component="h2" sx={sectionTitleSx}>
                Un aperçu des candidatures sur La bonne alternance
              </Typography>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Un volume de candidatures qui double en un an
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Sur La bonne alternance, l’activité des candidats atteint un niveau sans précédent&nbsp;: {strong("707 059 candidatures")} ont été déposées au 3e trimestre 2026,
                soit une progression de {positive("+109 %")} par rapport au 3e trimestre 2025. En un an, le volume de candidatures a été multiplié par deux sur ce trimestre.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Cette accélération ne s’explique pas uniquement par un surcroît d’intérêt pour l’alternance. Elle reflète aussi une tension sur le marché&nbsp;: les candidats
                multiplient leurs démarches, élargissent le périmètre de leur recherche et activent tous les leviers disponibles, dont la candidature spontanée, pour se positionner
                avant la rentrée de septembre. Une partie significative de cette hausse est directement imputable aux travaux conduits par l’équipe de La bonne alternance pour
                améliorer la visibilité et la notoriété de la plateforme.
              </Typography>

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  La hausse des candidatures reflète à la fois une meilleure visibilité de La bonne alternance, une évolution des comportements de recherche et une réponse
                  rationnelle à un marché où les offres publiées ne couvrent qu’une fraction des opportunités réelles.
                </Typography>
              </Insight>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Où se situent les recruteurs qui déposent les offres sur La bonne alternance ?
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                La répartition géographique des offres confirme la concentration historique sur quelques grandes régions, avec quelques évolutions notables au 3e trimestre 2026.
              </Typography>

              <RegionsMap
                title="Part des offres par région — 3e trimestre 2026"
                caption="Nombre d’offres et part du total national"
                mapLabel="Carte de France des régions : l’Île-de-France concentre 37,1 % des offres, les territoires ultramarins et la Corse moins de 1 %. Le détail figure dans les listes voisines."
                top={topRegionsOffres}
                flop={flopRegionsOffres}
                otherLabel="Autres régions : de 20 à 465 offres"
              />

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  {strong("L’Île-de-France")} concentre à elle seule {strong("37,1 %")} des offres actives sur la plateforme, plus d’une offre sur trois. Auvergne-Rhône-Alpes,
                  l’Occitanie, Provence-Alpes-Côte d’Azur et les Hauts-de-France complètent le classement, ces cinq premières régions représentant à elles seules {strong("72 %")}{" "}
                  du total. À l’inverse, les territoires ultramarins restent quasi absents de la plateforme, ce qui illustre les marges de progression de La bonne alternance
                  au-delà des régions historiquement dynamiques.
                </Typography>
              </Insight>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Quels métiers ciblés par les candidats sur La bonne alternance ?
              </Typography>

              <Typography component="p" sx={{ ...paragraphSx, fontStyle: "italic" }}>
                Fonctions tertiaires sous forte pression, métiers du soin et du commerce absents du radar.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Les métiers les plus recherchés par les candidats sur La bonne alternance sont massivement concentrés sur les fonctions support et tertiaires&nbsp;:{" "}
                {italic("assistant RH, assistant commercial, chargé de communication, assistant comptable, secrétaire")}. Ces cinq profils totalisent à eux seuls près de{" "}
                {strong("36 000 candidatures")}, soit environ une candidature sur cinq en réponse à une offre.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                À l’opposé, la quasi-absence de candidatures pour des métiers comme{" "}
                {italic("chargé de formation en entreprise, aide agricole en production végétale, agent de stérilisation de service hospitalier")} ou{" "}
                {italic("agent de quai manutentionnaire")} signalerait potentiellement un décalage entre la plateforme et les canaux de recrutement habituels de ces secteurs. Ces
                métiers passent par l’intérim, les groupements d’employeurs, la cooptation directe CFA-entreprises, ou des réseaux de proximité moins connectés aux outils
                numériques.
              </Typography>

              <MetiersMosaic
                title="Les 10 métiers qui reçoivent le plus de candidatures"
                caption="Nombre de candidatures, chaque surface est proportionnelle au volume"
                items={topMetiersCandidats}
              />

              <ChartFrame title="À l’autre bout du classement, des métiers avec une seule candidature">
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: fr.spacing("2v") }}>
                  {flopMetiersCandidats.map((metier) => (
                    <Box
                      component="li"
                      key={metier}
                      sx={{
                        px: fr.spacing("3v"),
                        py: fr.spacing("1v"),
                        fontSize: "14px",
                        borderRadius: "2px",
                        backgroundColor: fr.colors.decisions.background.contrast.grey.default,
                        color: fr.colors.decisions.text.default.grey.default,
                      }}
                    >
                      {metier}
                    </Box>
                  ))}
                </Box>
              </ChartFrame>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Où se situent les candidats sur La bonne alternance ?
              </Typography>

              <RegionsMap
                title="Part des candidatures sur offre par région — 3e trimestre 2026"
                caption="Nombre de candidatures en réponse à une offre et part du total national"
                mapLabel="Carte de France des régions : l’Île-de-France capte 53,9 % des candidatures en réponse à une offre, les territoires ultramarins et la Corse moins de 1 %. Le détail figure dans les listes voisines."
                top={topRegionsCandidatures}
                flop={flopRegionsCandidatures}
                otherLabel="Autres régions : de 491 à 9 260 candidatures"
              />

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  Du côté des candidatures, la concentration est encore plus marquée&nbsp;: {strong("l’Île-de-France capte 53,9 %")} des candidatures en réponse à une offre, soit
                  plus d’une candidature sur deux. Auvergne-Rhône-Alpes (8,6 %), Provence-Alpes-Côte d’Azur (6,4 %) et l’Occitanie (6,4 %) suivent loin derrière. Ce déséquilibre
                  s’explique par la surreprésentation des profils tertiaires franciliens parmi les candidats de la plateforme, et par la concentration naturelle des offres publiées
                  en Île-de-France.
                </Typography>
              </Insight>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Les secteurs sous tension sous l’angle de La bonne alternance
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Parmi les secteurs ayant reçu au moins 1 000 candidatures, le numérique est le plus disputé&nbsp;: {italic("édition de logiciels, programmation informatique")} et{" "}
                {italic("conseil en systèmes informatiques")} comptent 3 à 4 opportunités pour 100 candidatures. À l’inverse, la {italic("boulangerie")} en propose 20 pour 100
                candidatures, devant la {italic("restauration")} et l’{italic("accueil de jeunes enfants")}.
              </Typography>

              <PictoRanking
                title="Combien d’opportunités pour 100 candidatures ?"
                caption="Chaque carré représente une opportunité pour 100 candidatures reçues (opp. = opportunités)"
                groups={[
                  { title: "Les secteurs les plus disputés", color: fr.colors.decisions.background.actionHigh.orangeTerreBattue.default, items: secteursSousTension },
                  { title: "Les secteurs les moins disputés", color: fr.colors.decisions.background.actionHigh.blueFrance.default, items: secteursMoinsSousTension },
                ]}
              />

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  Dans ce contexte, fluidifier la rencontre entre ces deux réalités devient un enjeu central et c’est précisément là que La bonne alternance a un rôle à jouer.
                </Typography>
              </Insight>

              <Typography component="h2" sx={sectionTitleSx}>
                La bonne alternance : un service public facilitant la rencontre entre offre et demande
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Dans un marché sous tension, La bonne alternance agit là où elle peut avoir un impact concret&nbsp;: réduire les frictions, élargir l’accès et mettre en relation
                ceux qui cherchent avec ceux qui recrutent, indépendamment de leur réseau, de leur territoire ou de leur niveau de qualification. C’est cette ambition de service
                public qui guide les actions engagées au 3e trimestre 2026 et que les données commencent à refléter.
              </Typography>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Une plateforme où l’alternance est pour tous les niveaux
              </Typography>

              <ShareBar title="Niveau de diplôme recherché par les recruteurs" caption="Répartition des 6 167 offres du 3e trimestre 2026, du CAP au Bac+5" items={niveauDiplome} />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Une plateforme où les candidatures spontanées sont un levier pour accéder au marché caché
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Là où les offres publiées ne suffisent pas, La bonne alternance mobilise un levier distinctif&nbsp;: l’identification du marché caché. En croisant notamment les
                recrutements passés des entreprises, leurs données financières et les candidatures déjà reçues, la plateforme établit une liste ciblée d’entreprises à fort
                potentiel d’embauche en alternance permettant à tous les candidats d’engager des démarches spontanées éclairées.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Au 3e trimestre 2026, {strong("76 %")} des candidatures déposées sur La bonne alternance sont des candidatures spontanées. Ce chiffre marque une progression nette
                par rapport au 3e trimestre 2025 (36 %). Ce basculement tient notamment aux travaux menés sur La bonne alternance pour améliorer le référencement et la mise en
                avant des entreprises susceptibles de recruter grâce à notre algorithme prédictif.
              </Typography>

              <BarChartVertical
                title="Comment les candidats envoient-ils leurs candidatures sur La bonne alternance ?"
                caption="Répartition trimestrielle par type de candidature"
                legend={candidaturesParTypeLegend}
                items={candidaturesParType}
              />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Accompagner les candidats là où les offres ne suffisent pas
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                L’un des apports distinctifs de La bonne alternance est d’accompagner les candidats vers des secteurs et des entreprises qui recrutent sans nécessairement publier
                d’offres. Au 3e trimestre 2026, le top 10 des secteurs en candidature spontanée diffère radicalement de celui des offres publiées.
              </Typography>

              <BarChartHorizontal title="Top 10 secteurs les plus sollicités en candidature spontanée — 3e trimestre 2026" items={topSecteursSpontanees} tone="success" />

              <Typography component="p" sx={paragraphSx}>
                La comptabilité (6,7 %) et le conseil informatique (4,7 %) dominent ce classement avec un écart sensible sur les autres secteurs. Cette concentration s’explique par
                une double contrainte&nbsp;: ces secteurs affichent une faible représentation dans les offres publiées, ce qui réduit mécaniquement les opportunités visibles, tout
                en étant parmi les plus recherchés par les candidats.
              </Typography>

              <Insight>
                <Typography component="p" sx={{ m: 0 }}>
                  La candidature spontanée devient une réponse rationnelle qui complète un marché visible insuffisant.
                </Typography>
              </Insight>
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>

      <Box sx={{ backgroundColor: "#000091", color: "#fff" }}>
        <DefaultContainer>
          <Box
            sx={{
              py: { xs: fr.spacing("10v"), md: fr.spacing("16v") },
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 5fr) minmax(0, 7fr)" },
              columnGap: fr.spacing("12v"),
              rowGap: fr.spacing("4v"),
            }}
          >
            <Typography component="h2" sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "28px", md: "32px" }, lineHeight: { xs: "36px", md: "40px" }, m: 0 }}>
              Ce qu’il faudra surveiller au 4e trimestre 2026
            </Typography>
            <Box>
              <Typography component="p" sx={{ color: "#fff", mb: fr.spacing("3v") }}>
                Le 4e trimestre est historiquement un trimestre de repli des offres et d’essoufflement des candidatures, après le pic de rentrée. Deux questions structurelles se
                posent. D’une part, les entreprises qui n’ont pas finalisé leurs recrutements à la rentrée de septembre vont-elles publier une dernière vague d’offres en
                octobre-novembre, ou le marché se referme-t-il plus tôt que les années précédentes ? D’autre part, la part importante des candidatures spontanées permettra-t-elle
                de compenser le manque structurel d’offres publiées ?
              </Typography>
              <Typography component="p" sx={{ color: "#fff", mb: fr.spacing("6v") }}>
                Le niveau exceptionnel de candidatures spontanées, 76 % au 3e trimestre, va-t-il se maintenir à mesure que les candidats non placés continuent leur recherche, ou
                refluer avec la fin du cycle de rentrée ?
              </Typography>
              <a href={PAGES.static.barometreT1.getPath()} style={{ color: "#fff" }}>
                Consulter le baromètre du premier trimestre 2026
              </a>
            </Box>
          </Box>
        </DefaultContainer>
      </Box>
    </Box>
  )
}
