import { fr } from "@codegouvfr/react-dsfr"
import { Highlight } from "@codegouvfr/react-dsfr/Highlight"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { SchemaOrg } from "@/components/SchemaOrg"
import { PAGES } from "@/utils/routes.utils"

import { BarChartHorizontal } from "./_components/BarChartHorizontal"
import { BarChartVertical } from "./_components/BarChartVertical"
import { Callout } from "./_components/Callout"
import { SectionTitle } from "./_components/SectionTitle"
import {
  BAROMETRE_FAQ,
  BAROMETRE_KEYWORDS,
  candidaturesParMois,
  candidaturesParType,
  candidaturesParTypeLegend,
  flopMetiersCandidats,
  metiersMoinsSousTension,
  metiersSousTension,
  niveauDiplome,
  offresParRegion,
  offresParTrimestre,
  PUBLISHED_DATE,
  topMetiersCandidats,
  topMetiersRecruteurs,
  topSecteursRecruteurs,
  topSecteursSpontanees,
} from "./_data/t1-2026"
export const metadata: Metadata = {
  ...PAGES.static.barometre.getMetadata(),
  alternates: {
    canonical: PAGES.static.barometre.getPath(),
  },
}

const positive = (s: string) => (
  <Typography component="span" sx={{ color: fr.colors.decisions.text.default.success.default, fontWeight: 700 }}>
    {s}
  </Typography>
)
const negative = (s: string) => (
  <Typography component="span" sx={{ color: fr.colors.decisions.text.default.error.default, fontWeight: 700 }}>
    {s}
  </Typography>
)
const strong = (s: string) => (
  <Typography
    component="span"
    sx={{
      fontWeight: 700,
      backgroundImage: `linear-gradient(to top, ${fr.colors.decisions.background.alt.purpleGlycine.default} 38%, transparent 38%)`,
      backgroundRepeat: "no-repeat",
      px: "2px",
    }}
  >
    {s}
  </Typography>
)

const subSectionTitleSx = {
  mt: fr.spacing("8v"),
  mb: fr.spacing("3v"),
  color: fr.colors.decisions.text.title.grey.default,
  fontWeight: 700,
} as const

const paragraphSx = { mb: fr.spacing("3v"), color: fr.colors.decisions.text.default.grey.default } as const

export default function BarometrePage() {
  return (
    <Box>
      <SchemaOrg
        type="Article"
        title={PAGES.static.barometre.getMetadata().title as string}
        description={PAGES.static.barometre.getMetadata().description as string}
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

      <DefaultContainer>
        <Grid container>
          <Grid size={{ md: 2, xs: 0 }} />
          <Grid size={{ md: 8, xs: 12 }}>
            <Box component="article" sx={{ pb: fr.spacing("16v") }}>
              <Typography component="p" sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("2v") }}>
                Publié le 13 mai 2026
              </Typography>

              <SectionTitle
                component="h1"
                title="Le marché de l’alternance"
                highlightedText="au premier trimestre 2026 sur La bonne alternance"
                fontSize="40px"
                lineHeight="48px"
              />

              <Box sx={{ mb: fr.spacing("6v") }}>
                <Highlight>
                  Les données présentées dans ce baromètre sont issues exclusivement de La bonne alternance et reflètent l’activité observée sur la plateforme. Elles ne constituent
                  pas un indicateur exhaustif du marché de l’alternance.
                </Highlight>
              </Box>

              <Callout variant="highlight">
                <Typography component="p" sx={{ fontWeight: 700, mb: fr.spacing("3v") }}>
                  Ce qu’il faut retenir du premier trimestre 2026&nbsp;:
                </Typography>
                <Box component="ul" sx={{ pl: fr.spacing("4v"), m: 0, "& > li": { mb: fr.spacing("2v") } }}>
                  <li>
                    <strong>Un marché qui se contracte</strong>&nbsp;: première baisse des entrées en apprentissage depuis 2018 ({negative("-4,8 %")}).
                  </li>
                  <li>
                    <strong>Une plateforme qui résiste</strong>&nbsp;: une stabilité des offres publiées par les recruteurs ({positive("+1 %")}).
                  </li>
                  <li>
                    <strong>Une demande qui s’accentue</strong>&nbsp;: ~320 000 candidatures sur La bonne alternance, avec un pic important en mars 2026 ({positive("+58 %")} par
                    rapport à mars 2025).
                  </li>
                  <li>
                    <strong>Un déséquilibre par métier</strong>&nbsp;: une forte concentration de candidats sur certains métiers, tandis que d’autres secteurs manquent de
                    candidatures.
                  </li>
                  <li>
                    <strong>74 % de candidatures spontanées</strong>&nbsp;: la plateforme révèle le marché caché là où les offres publiées ne suffisent plus.
                  </li>
                </Box>
              </Callout>

              {/* ---------- SECTION 1 ---------- */}
              <SectionTitle title="Un marché qui se contracte," highlightedText="une plateforme qui résiste" mt={fr.spacing("12v")} />

              <Typography component="p" sx={paragraphSx}>
                Pour la première fois depuis la loi Avenir professionnel de 2018, les entrées en contrat d’apprentissage reculent&nbsp;: {negative("-4,8 %")} en 2025 sur un an. Les
                formations du supérieur sont les plus exposées, avec {negative("-12,4 %")} de nouvelles entrées en janvier 2026 sur un an (
                <DsfrLink href="https://dares.travail-emploi.gouv.fr/" aria-label="Accéder au site de la DARES - nouvelle fenêtre">
                  DARES
                </DsfrLink>
                ).
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Dans ce contexte, La bonne alternance affiche pourtant une résilience notable&nbsp;: avec près de {strong("6 000 offres")} déposées directement sur la plateforme au
                premier trimestre 2026, le volume se maintient quasi à l’identique du premier trimestre 2025 ({positive("+1 %")}).
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                La saisonnalité est clé&nbsp;: le premier trimestre est un trimestre de démarrage, alors que le deuxième trimestre concentre le pic de recrutements, comme le
                montrent les{" "}
                <DsfrLink href="https://dares.travail-emploi.gouv.fr/" aria-label="Accéder aux données DARES - nouvelle fenêtre">
                  données DARES
                </DsfrLink>
                . L’évolution du deuxième trimestre sera donc le meilleur indicateur de la tendance 2026.
              </Typography>

              <BarChartVertical
                title="Comment les offres déposées directement sur La bonne alternance évoluent-elles ?"
                caption="Variation vs même trimestre année précédente"
                items={offresParTrimestre}
                yAxisLabel="Nombre d’offres"
              />

              <Callout variant="highlight">
                <Typography component="p" sx={{ m: 0 }}>
                  👉 Maintenir un volume d’offres stable alors que le marché se contracte est — toutes choses étant égales par ailleurs — un signal encourageant&nbsp;: il témoigne
                  d’une certaine fidélité des recruteurs à la plateforme et d’un ancrage progressif dans les pratiques de recrutement en alternance.
                </Typography>
              </Callout>

              {/* ---------- SECTION 2 ---------- */}
              <SectionTitle title="Un aperçu de l’offre de recrutement" highlightedText="sur La bonne alternance" mt={fr.spacing("12v")} />

              <Typography component="p" sx={paragraphSx}>
                Les offres {strong("actives")} sur La bonne alternance au premier trimestre 2026 reflètent une concentration marquée sur les métiers de la restauration et du
                commerce de proximité. Les 10 premiers métiers du classement appartiennent tous à ces deux univers&nbsp;: de l’agent de cuisine au vendeur en boulangerie, en
                passant par le conseiller de vente et l’employé de libre-service. Une tendance cohérente avec la structure de l’apprentissage en France, où les niveaux infrabac et
                CAP restent très présents, et où la restauration constitue historiquement le premier secteur recruteur en alternance.
              </Typography>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Top 10 des métiers recherchés par les recruteurs sur La bonne alternance
              </Typography>

              <BarChartHorizontal title="Métiers les plus recherchés par les recruteurs — premier trimestre 2026" items={topMetiersRecruteurs} tone="info" />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Top 10 des secteurs qui recrutent le plus sur La bonne alternance
              </Typography>

              <BarChartHorizontal title="Secteurs qui publient le plus d’offres — premier trimestre 2026" items={topSecteursRecruteurs} tone="info" />

              <Callout variant="highlight">
                <Typography component="p" sx={{ m: 0 }}>
                  👉 Sur La bonne alternance, les offres restent dominées par la restauration et le commerce, mais la présence croissante du tertiaire — comme le conseil, la
                  gestion et la comptabilité — traduit une diversification progressive des recruteurs qui déposent sur la plateforme. Un signal utile pour mieux orienter les
                  candidats vers les filières où les opportunités se développent.
                </Typography>
              </Callout>

              {/* ---------- SECTION 3 ---------- */}
              <SectionTitle title="Un aperçu des candidatures" highlightedText="sur La bonne alternance" mt={fr.spacing("12v")} />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Une demande en hausse dans un marché qui se resserre
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Sur La bonne alternance, l’activité des candidats reste soutenue&nbsp;: près de {strong("320 000 candidatures")} ont été déposées au premier trimestre 2026, soit
                une progression de {positive("+7 %")} par rapport au premier trimestre 2025.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                La lecture mensuelle est encore plus révélatrice. Janvier et février s’inscrivent dans la continuité d’un quatrième trimestre 2025 en retrait, avant que mars ne
                rompe avec cette tendance&nbsp;: {positive("+58 %")} sur un an, avec un volume de candidatures qui double par rapport à février.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Ce basculement s’explique par la conjonction de plusieurs facteurs&nbsp;: une professionnalisation croissante des candidats, qui n’attendent plus l’été pour
                postuler&nbsp;; une tension accrue sur le marché&nbsp;; et l’impact mesurable des travaux de l’équipe La bonne alternance pour améliorer le référencement naturel de
                la plateforme.
              </Typography>

              <BarChartVertical
                title="Comment les candidatures sur La bonne alternance ont-elles évolué par mois ?"
                caption="Variation vs même mois de l’année précédente"
                items={candidaturesParMois}
                yAxisLabel="Nombre de candidatures"
              />

              <Callout variant="highlight">
                <Typography component="p" sx={{ m: 0 }}>
                  👉 Une partie de la hausse des candidatures reflète une meilleure visibilité de La bonne alternance autant qu’une évolution des comportements de recherche.
                </Typography>
              </Callout>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Où se situent les recruteurs qui déposent les offres sur La bonne alternance ?
              </Typography>

              <BarChartHorizontal title="Part des offres concentrée dans chaque région — premier trimestre 2026" items={offresParRegion} tone="success" />

              <Callout variant="highlight">
                <Typography component="p" sx={{ m: 0 }}>
                  👉 {strong("L’Île-de-France")} concentre à elle seule {strong("27,5 %")} des offres d’alternance déposées sur La bonne alternance, devant le Grand Est (
                  {strong("11,7 %")}) et Auvergne-Rhône-Alpes ({strong("10,3 %")}). Ces trois régions regroupent près d’une offre sur deux, soit {strong("49,5 %")} du total.
                </Typography>
              </Callout>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Quels métiers ciblés par les candidats sur La bonne alternance ?
              </Typography>

              <Typography component="p" sx={{ ...paragraphSx, fontStyle: "italic" }}>
                Fonctions tertiaires sous forte pression, métiers manuels hors radar.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Les métiers les plus recherchés par les candidats sur La bonne alternance sont dominés par les fonctions support et tertiaires&nbsp;:{" "}
                <em>comptable, assistant RH, assistant commercial, secrétaire</em>. Ces profils concentrent une demande forte des jeunes.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                À l’opposé, la quasi-absence de candidatures sur La bonne alternance pour des métiers comme <em>cariste, bobinier, ajusteur-monteur</em> ou <em>aide agricole</em>{" "}
                ne reflète probablement pas un manque d’opportunités. Elle pourrait davantage traduire un décalage entre l’outil numérique et les réalités de ces secteurs. Pour ces
                métiers, le recrutement passerait potentiellement par des canaux alternatifs&nbsp;: l’intérim pour la logistique et l’industrie, les groupements d’employeurs et
                réseaux de proximité pour l’agriculture, la cooptation directe entre CFA et entreprises partenaires pour les métiers spécialisés. À cela s’ajouterait une
                familiarité moindre avec les outils numériques comme La bonne alternance.
              </Typography>

              <Callout variant="list">
                <Typography component="p" sx={{ m: 0 }}>
                  📊 Selon{" "}
                  <DsfrLink href="https://www.francetravail.fr/" aria-label="Accéder au site de France Travail - nouvelle fenêtre">
                    France Travail
                  </DsfrLink>{" "}
                  et la DARES, seulement {strong("17 %")} des ouvriers utiliseraient un ordinateur quotidiennement au travail, contre {strong("75 %")} des diplômés du supérieur.
                </Typography>
              </Callout>

              <Box sx={{ display: "grid", gap: fr.spacing("4v"), gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <BarChartHorizontal title="Top 10 métiers les plus demandés par les candidats" items={topMetiersCandidats} tone="success" />
                <BarChartHorizontal title="Flop 10 métiers — les moins de candidatures" items={flopMetiersCandidats} tone="error" />
              </Box>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Les métiers sous tension sous l’angle de La bonne alternance
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Les métiers les plus concurrentiels pour les candidats se concentrent principalement dans le numérique et le tertiaire qualifié. On retrouve notamment
                <em> développeur web, data engineer, développeur logiciel</em>, ou encore <em>administrateur SI</em>.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Ces métiers attirent beaucoup de candidatures, alors que le volume d’offres publiées reste limité. Deux explications sont possibles&nbsp;: soit La bonne alternance
                couvre encore peu ces métiers, soit l’offre en alternance sur ces profils est structurellement faible par rapport à la demande. Le métier de <em>graphiste</em>
                illustre le même phénomène sur des profils plus créatifs.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                À l’inverse, les métiers les moins concurrentiels sont davantage représentés par des métiers manuels, notamment dans le BTP et la mécanique spécialisée. Parmi les
                exemples observés&nbsp;: <em>maçon/maçonne, couvreur/couvreuse</em>, ou encore <em>mécanicien d’engins de chantier et de travaux publics</em>.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Ces résultats doivent toutefois être interprétés avec prudence, car les volumes restent faibles, entre {strong("18 et 96 candidatures")} selon les métiers. Un
                faible niveau de concurrence sur La bonne alternance ne signifie donc pas automatiquement une insertion plus facile, mais plutôt une{" "}
                {strong("opportunité de visibilité plus forte pour les candidats qui se positionnent sur ces métiers sur La bonne alternance")}.
              </Typography>

              <Box sx={{ display: "grid", gap: fr.spacing("4v"), gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <BarChartHorizontal
                  title="Métiers les plus sous tension (plus de candidats que d’offres)"
                  caption="Ratio offres / candidatures (le plus faible)"
                  items={metiersSousTension}
                  tone="error"
                />
                <BarChartHorizontal title="Métiers les moins sous tension (ratio offres/cand. le plus élevé)" items={metiersMoinsSousTension} tone="success" />
              </Box>

              <Callout variant="highlight">
                <Typography component="p" sx={{ m: 0 }}>
                  👉 Dans ce contexte, fluidifier la rencontre entre ces deux réalités devient un enjeu central et c’est précisément là que La bonne alternance a un rôle à jouer.
                </Typography>
              </Callout>

              {/* ---------- SECTION 4 ---------- */}
              <SectionTitle title="La bonne alternance :" highlightedText="un service public au service de la rencontre entre offre et demande" mt={fr.spacing("12v")} />

              <Typography component="p" sx={paragraphSx}>
                Dans un marché sous tension, La bonne alternance agit là où elle peut avoir un impact concret&nbsp;: réduire les frictions, élargir l’accès et mettre en relation
                ceux qui cherchent avec ceux qui recrutent, indépendamment de leur réseau, de leur territoire ou de leur niveau de qualification. C’est cette ambition de service
                public qui guide les actions engagées au premier trimestre 2026 et que les données commencent à refléter.
              </Typography>

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Une plateforme où l’alternance est pour tous les niveaux
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                La bonne alternance conserve une exposition notable aux premiers niveaux de qualification. Au premier trimestre 2026, les formations Bac+2 constituent le niveau de
                diplôme le plus recherché par les recruteurs ({strong("28 %")}), devant les offres sans exigence de diplôme spécifique ({strong("25 %")}). Les niveaux Infrabac
                restent toutefois bien représentés, avec {strong("901 offres")} CAP et autres formations Infrabac, soit le troisième niveau le plus demandé sur la plateforme (
                {strong("15 %")}
                ).
              </Typography>

              <BarChartHorizontal title="Quel est le niveau de diplôme le plus recherché par les recruteurs ?" items={niveauDiplome} tone="info" />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Une plateforme où les candidatures spontanées sont un levier pour accéder au marché caché
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Face à la contraction des offres publiées, La bonne alternance mobilise un levier distinctif&nbsp;: l’identification du marché caché. En croisant les recrutements
                passés des entreprises, leurs données financières et les candidatures déjà reçues, la plateforme établit une liste ciblée d’entreprises à fort potentiel d’embauche
                en alternance permettant aux candidats d’engager des démarches spontanées éclairées, sans réseau préalable.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Au premier trimestre 2026, près de {strong("8 candidatures sur 10")} sont des candidatures spontanées sur La bonne alternance, marqueur structurel d’un trimestre où
                les offres publiées n’ont pas encore atteint leur pic, mais où les candidats sont déjà en recherche active.
              </Typography>

              <BarChartVertical
                title="Comment les candidats envoient-ils leurs candidatures sur La bonne alternance ?"
                caption="Répartition trimestrielle par type de candidature"
                legend={candidaturesParTypeLegend}
                items={candidaturesParType}
                yAxisLabel="Nombre de candidatures"
              />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Accompagner les candidats là où les offres ne suffisent pas
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                L’un des apports distinctifs de La bonne alternance est d’orienter les candidats vers des secteurs et des entreprises qui recrutent sans nécessairement publier
                d’offres. Le top 10 des secteurs en candidature spontanée diffère sensiblement de celui des offres publiées&nbsp;: <em>santé, social et services de proximité</em> y
                dominent largement.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Les métiers les plus sous tension — numérique, tertiaire qualifié, fonctions support — sont aussi ceux où les candidats se tournent le plus vers la démarche
                spontanée, faute d’offres suffisantes. La candidature spontanée devient une réponse rationnelle à un marché visible insuffisant.
              </Typography>

              <BarChartHorizontal title="Top 10 secteurs les plus sollicités en candidature spontanée — premier trimestre 2026" items={topSecteursSpontanees} tone="success" />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Qualité, maillage et accompagnement&nbsp;: les engagements de la plateforme
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                Au-delà de l’agrégation et de la mise en relation, La bonne alternance s’attache à garantir la fiabilité de l’expérience candidat. Un dispositif de contrôle qualité
                des offres permet d’identifier et d’écarter les offres obsolètes ou frauduleuses, un enjeu non négligeable dans un marché où les fausses offres constituent un frein
                réel à l’engagement des candidats.
              </Typography>

              <Typography component="p" sx={paragraphSx}>
                En parallèle, la plateforme continue de renforcer son maillage avec l’écosystème de l’alternance, notamment à l’échelle territoriale. Ce travail de fond —
                partenariats avec les CFA, les missions locales, les opérateurs de compétences et les acteurs de l’insertion — se traduit par des actions d’accompagnement ciblées,
                pensées pour atteindre les candidats les plus éloignés du marché et les aider à concrétiser leur projet d’alternance, là où une plateforme seule ne suffirait pas.
              </Typography>

              {/* ---------- CONCLUSION ---------- */}
              <Callout variant="watch">
                <Typography component="p" sx={{ fontWeight: 700, mb: fr.spacing("3v") }}>
                  Ce qu’il faudra surveiller au deuxième trimestre 2026
                </Typography>
                <Typography component="p" sx={{ m: 0 }}>
                  Le deuxième trimestre sera un révélateur de la trajectoire du marché de l’alternance. C’est historiquement le pic annuel&nbsp;: les vœux Parcoursup se
                  concrétisent, les entreprises lancent leurs campagnes de recrutement pour la rentrée de septembre, et les volumes d’offres atteignent leur maximum. La question
                  centrale est l’effet de la dernière baisse des aides sur ce cycle saisonnier.
                </Typography>
                <Typography component="p" sx={{ mt: fr.spacing("3v"), m: 0, fontStyle: "italic" }}>
                  Les entreprises vont-elles maintenir leur rythme de publication d’offres malgré un soutien public amoindri, ou le deuxième trimestre 2026 marquera-t-il le premier
                  pic saisonnier en recul ?
                </Typography>
              </Callout>
            </Box>
          </Grid>
          <Grid size={{ md: 2, xs: 0 }} />
        </Grid>
      </DefaultContainer>
    </Box>
  )
}
