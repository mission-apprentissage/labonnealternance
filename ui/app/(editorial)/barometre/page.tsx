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

export const metadata: Metadata = {
  ...PAGES.static.barometre.getMetadata(),
  alternates: {
    canonical: PAGES.static.barometre.getPath(),
  },
}

const BAROMETRE_FAQ = [
  {
    question: "Quels sont les métiers les plus recherchés par les recruteurs en alternance au premier trimestre 2026 ?",
    answer:
      "Au T1 2026 sur La bonne alternance, les métiers les plus recherchés par les recruteurs sont l’agent de cuisine (3 094 offres), l’employé(e) polyvalent(e) de restauration (1 850), serveur / serveuse (1 790), commercial(e) (1 527) et assistant(e) administratif(ve) (1 039).",
  },
  {
    question: "Quels secteurs recrutent le plus en alternance au premier trimestre 2026 ?",
    answer:
      "Les secteurs qui publient le plus d’offres d’alternance sur La bonne alternance au T1 2026 sont la restauration traditionnelle (9 648 offres), la restauration rapide (4 583), la formation continue d’adultes (3 968), la boulangerie-pâtisserie (3 475) et le commerce de détail de meubles (2 383).",
  },
  {
    question: "Quelle est la part des candidatures spontanées sur La bonne alternance au T1 2026 ?",
    answer:
      "Au premier trimestre 2026, 74 % des candidatures envoyées sur La bonne alternance sont des candidatures spontanées, soit près de 8 sur 10. Ce levier permet aux candidats d’accéder au marché caché des entreprises qui recrutent sans publier d’offres.",
  },
  {
    question: "Comment évolue le marché de l’alternance au premier trimestre 2026 ?",
    answer:
      "Pour la première fois depuis 2018, les entrées en apprentissage reculent en France (-4,8 % en 2025 sur un an, source DARES). Sur La bonne alternance, les offres déposées par les recruteurs se maintiennent (+1 % vs T1 2025) et les candidatures progressent fortement (+58 % en mars 2026 vs mars 2025).",
  },
  {
    question: "Quelle région concentre le plus d’offres d’alternance sur La bonne alternance au T1 2026 ?",
    answer:
      "L’Île-de-France concentre 27,5 % des offres d’alternance déposées sur La bonne alternance au T1 2026, devant le Grand Est (11,7 %) et Auvergne-Rhône-Alpes (10,3 %). Ces trois régions représentent près d’une offre sur deux.",
  },
  {
    question: "Quels métiers sont les plus sous tension en alternance au T1 2026 ?",
    answer:
      "Les métiers les plus sous tension (plus de candidats que d’offres) sur La bonne alternance au T1 2026 sont le développement web, le data analyst, l’administration de systèmes d’information, le graphisme et le contrôle budgétaire. À l’inverse, les métiers du BTP (maçon, couvreur, mécanicien d’engins de chantier) restent peu concurrentiels.",
  },
]

const PUBLISHED_DATE = "2026-05-13"
const COLOR_OFFRES = fr.colors.decisions.background.actionHigh.blueFrance.default
const COLOR_CANDIDATURES = fr.colors.decisions.background.actionHigh.greenBourgeon.default
// Palette daltonien-safe pour le graphe empilé (bleu foncé / orange / gris) :
// le couple bleu+orange est distinguable par tous les types de daltonisme, le gris se détache par sa luminosité.
const COLOR_SPONTANEES = fr.colors.decisions.background.actionHigh.blueFrance.default
const COLOR_REPONSE = fr.colors.decisions.background.actionHigh.orangeTerreBattue.default
const COLOR_REDIRECTION = fr.colors.decisions.background.actionHigh.grey.default

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
        keywords={[
          "baromètre alternance",
          "marché de l’alternance",
          "alternance T1 2026",
          "candidatures alternance",
          "offres apprentissage",
          "métiers en alternance",
          "secteurs qui recrutent en alternance",
          "tensions alternance par région",
          "La bonne alternance",
        ]}
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
                items={[
                  { label: "T1 2025", segments: [{ value: 5840, color: COLOR_OFFRES, label: "Offres" }] },
                  { label: "T2 2025", segments: [{ value: 8920, color: COLOR_OFFRES, label: "Offres" }] },
                  { label: "T3 2025", segments: [{ value: 6980, color: COLOR_OFFRES, label: "Offres" }] },
                  { label: "T4 2025", segments: [{ value: 3420, color: COLOR_OFFRES, label: "Offres" }] },
                  { label: "T1 2026", segments: [{ value: 5950, color: COLOR_OFFRES, label: "Offres" }], annotation: "+1 %", highlighted: true },
                ]}
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

              <BarChartHorizontal
                title="Métiers les plus recherchés par les recruteurs — premier trimestre 2026"
                items={[
                  { label: "Agent de cuisine", value: 3094 },
                  { label: "Employé(e) polyvalent(e) de restauration", value: 1850 },
                  { label: "Serveur / Serveuse", value: 1790 },
                  { label: "Commercial(e)", value: 1527 },
                  { label: "Assistant(e) administratif(ve)", value: 1039 },
                  { label: "Vendeur(se) en boulangerie-pâtisserie", value: 784 },
                  { label: "Employé(e) polyvalent(e) de libre-service", value: 719 },
                  { label: "Esthéticien(ne) praticien(ne)", value: 617 },
                  { label: "Assistant(e) comptable", value: 531 },
                  { label: "Aide-boulanger / Aide-boulangère", value: 463 },
                ]}
                tone="info"
              />

              <Typography component="h3" variant="h3" sx={subSectionTitleSx}>
                Top 10 des secteurs qui recrutent le plus sur La bonne alternance
              </Typography>

              <BarChartHorizontal
                title="Secteurs qui publient le plus d’offres — premier trimestre 2026"
                items={[
                  { label: "Restauration traditionnelle", value: 9648 },
                  { label: "Restauration de type rapide", value: 4583 },
                  { label: "Formation continue d’adultes", value: 3968 },
                  { label: "Boulangerie et boulangerie-pâtisserie", value: 3475 },
                  { label: "Commerce de détail de meubles", value: 2383 },
                  { label: "Conseil pour les affaires et autres conseils de gestion", value: 1788 },
                  { label: "Services des traiteurs", value: 1671 },
                  { label: "Édition de livres", value: 1656 },
                  { label: "Activités des sièges sociaux", value: 1649 },
                  { label: "Hôtels et hébergement similaire", value: 1455 },
                ]}
                tone="info"
              />

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
                items={[
                  { label: "Janvier 2025", shortLabel: "Jan. 25", segments: [{ value: 89000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Février 2025", shortLabel: "Fév. 25", segments: [{ value: 105000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Mars 2025", shortLabel: "Mars 25", segments: [{ value: 105500, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Avril 2025", shortLabel: "Avr. 25", segments: [{ value: 82000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Mai 2025", shortLabel: "Mai 25", segments: [{ value: 108000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Juin 2025", shortLabel: "Juin 25", segments: [{ value: 121000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Juillet 2025", shortLabel: "Juil. 25", segments: [{ value: 115000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Août 2025", shortLabel: "Août 25", segments: [{ value: 89000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Septembre 2025", shortLabel: "Sept. 25", segments: [{ value: 123000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Octobre 2025", shortLabel: "Oct. 25", segments: [{ value: 78000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Novembre 2025", shortLabel: "Nov. 25", segments: [{ value: 64000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Décembre 2025", shortLabel: "Déc. 25", segments: [{ value: 52000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Janvier 2026", shortLabel: "Jan. 26", segments: [{ value: 67000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  { label: "Février 2026", shortLabel: "Fév. 26", segments: [{ value: 86000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
                  {
                    label: "Mars 2026",
                    shortLabel: "Mars 26",
                    segments: [{ value: 166000, color: COLOR_CANDIDATURES, label: "Candidatures" }],
                    annotation: "+58 %",
                    highlighted: true,
                  },
                ]}
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

              <BarChartHorizontal
                title="Part des offres concentrée dans chaque région — premier trimestre 2026"
                items={[
                  { label: "Île-de-France", value: 27.5, displayValue: "27,5 %" },
                  { label: "Grand Est", value: 11.7, displayValue: "11,7 %" },
                  { label: "Auvergne-Rhône-Alpes", value: 10.3, displayValue: "10,3 %" },
                  { label: "Provence-Alpes-Côte d’Azur", value: 7.8, displayValue: "7,8 %" },
                  { label: "Pays de la Loire", value: 7.2, displayValue: "7,2 %" },
                  { label: "Hauts-de-France", value: 5.7, displayValue: "5,7 %" },
                  { label: "Nouvelle-Aquitaine", value: 5.5, displayValue: "5,5 %" },
                  { label: "Occitanie", value: 5.2, displayValue: "5,2 %" },
                  { label: "Bretagne", value: 4.7, displayValue: "4,7 %" },
                  { label: "Bourgogne-Franche-Comté", value: 4.6, displayValue: "4,6 %" },
                  { label: "Normandie", value: 3.9, displayValue: "3,9 %" },
                  { label: "Centre-Val de Loire", value: 3.0, displayValue: "3,0 %" },
                  { label: "Corse", value: 0.5, displayValue: "0,5 %" },
                ]}
                tone="success"
              />

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
                <BarChartHorizontal
                  title="Top 10 métiers les plus demandés par les candidats"
                  items={[
                    { label: "Comptable", value: 3100 },
                    { label: "Assistant(e) RH", value: 2400 },
                    { label: "Assistant(e) commercial(e)", value: 2100 },
                    { label: "Secrétaire", value: 1900 },
                    { label: "Chargé(e) de communication", value: 1700 },
                    { label: "Attaché(e) commercial(e)", value: 1500 },
                    { label: "Chargé(e) de recrutement", value: 1300 },
                    { label: "Préparateur(trice) en pharmacie", value: 1200 },
                    { label: "Responsable marketing", value: 1100 },
                    { label: "Secrétaire médical(e)", value: 1000 },
                  ]}
                  tone="success"
                />
                <BarChartHorizontal
                  title="Flop 10 métiers — les moins de candidatures"
                  items={[
                    { label: "Cariste", value: 1 },
                    { label: "Bobinier(ère) en électricité", value: 1 },
                    { label: "Assistant(e) familial(e)", value: 1 },
                    { label: "Animateur(trice) nature environnement", value: 1 },
                    { label: "Ajusteur(se) - monteur(se)", value: 1 },
                    { label: "Aide agricole en production végétale", value: 1 },
                    { label: "Agent(e) de talent", value: 1 },
                    { label: "Agent(e) de stérilisation de service hospitalier", value: 1 },
                    { label: "Agent(e) de conditionnement", value: 1 },
                    { label: "Accompagnant(e) des élèves en situation de handicap (AESH)", value: 1 },
                  ]}
                  tone="error"
                />
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
                  items={[
                    { label: "Graphiste (3 offres / 173 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Responsable de magasin (20 offres / 235 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Assistant(e) de contrôle budgétaire (11 offres / 540 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Data analyst (10 offres / 597 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Chargé(e) des relations publiques (13 offres / 669 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Développeur(se) logiciel ou d’application (13 offres / 669 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Développeur(se) web (21 offres / 1 038 cand.)", value: 0.02, displayValue: "0,02" },
                    { label: "Responsable en organisation en entreprise (1 offre / 122 cand.)", value: 0.01, displayValue: "0,01" },
                    { label: "Secrétaire facturier(ère) (2 offres / 159 cand.)", value: 0.01, displayValue: "0,01" },
                    { label: "Administrateur(trice) de systèmes d’information (15 offres / 1 004 cand.)", value: 0.01, displayValue: "0,01" },
                  ]}
                  tone="error"
                />
                <BarChartHorizontal
                  title="Métiers les moins sous tension (ratio offres/cand. le plus élevé)"
                  items={[
                    { label: "Maçon / Maçonne (22 offres / 28 cand.)", value: 0.79, displayValue: "0,79" },
                    { label: "Couvreur / Couvreuse (20 offres / 30 cand.)", value: 0.67, displayValue: "0,67" },
                    { label: "Gestionnaire en assurances (19 offres / 32 cand.)", value: 0.59, displayValue: "0,59" },
                    { label: "Mécanicien d’engins de chantier et de TP (15 offres / 26 cand.)", value: 0.58, displayValue: "0,58" },
                    { label: "Mécanicien réparateur de matériels agricoles (10 offres / 18 cand.)", value: 0.56, displayValue: "0,56" },
                    { label: "Poseur(se) en fermetures du bâtiment (14 offres / 27 cand.)", value: 0.52, displayValue: "0,52" },
                    { label: "Boucher / Bouchère (29 offres / 56 cand.)", value: 0.52, displayValue: "0,52" },
                    { label: "Fleuriste (15 offres / 32 cand.)", value: 0.47, displayValue: "0,47" },
                    { label: "Jardinier(ère) paysagiste (38 offres / 96 cand.)", value: 0.4, displayValue: "0,40" },
                  ]}
                  tone="success"
                />
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

              <BarChartHorizontal
                title="Quel est le niveau de diplôme le plus recherché par les recruteurs ?"
                items={[
                  { label: "BTS, DEUST (Bac+2)", value: 28, displayValue: "28 %" },
                  { label: "Indifférent", value: 25, displayValue: "25 %" },
                  { label: "CAP, BEP (Infrabac)", value: 15, displayValue: "15 %" },
                  { label: "Bac, Bac Pro, BP (Bac)", value: 12, displayValue: "12 %" },
                  { label: "Licence, BUT, Licence Pro (Bac+3)", value: 11, displayValue: "11 %" },
                  { label: "Master, titre ingénieur, grande école (Bac+5)", value: 8, displayValue: "8 %" },
                ]}
                tone="info"
              />

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
                legend={[
                  { label: "Candidatures spontanées", color: COLOR_SPONTANEES },
                  { label: "Candidatures en réponse à une offre sur La bonne alternance", color: COLOR_REPONSE },
                  { label: "Candidatures via redirection chez nos partenaires", color: COLOR_REDIRECTION },
                ]}
                items={[
                  {
                    label: "T1 2025",
                    totalDisplay: "299 741",
                    segments: [
                      { value: 248785, color: COLOR_SPONTANEES, label: "Spontanées (83 %)" },
                      { value: 30000, color: COLOR_REPONSE, label: "Sur offre" },
                      { value: 20956, color: COLOR_REDIRECTION, label: "Redirection" },
                    ],
                  },
                  {
                    label: "T2 2025",
                    totalDisplay: "311 520",
                    segments: [
                      { value: 143299, color: COLOR_SPONTANEES, label: "Spontanées (46 %)" },
                      { value: 110000, color: COLOR_REPONSE, label: "Sur offre" },
                      { value: 58221, color: COLOR_REDIRECTION, label: "Redirection" },
                    ],
                  },
                  {
                    label: "T3 2025",
                    totalDisplay: "337 929",
                    segments: [
                      { value: 121654, color: COLOR_SPONTANEES, label: "Spontanées (36 %)" },
                      { value: 140000, color: COLOR_REPONSE, label: "Sur offre" },
                      { value: 76275, color: COLOR_REDIRECTION, label: "Redirection" },
                    ],
                  },
                  {
                    label: "T4 2025",
                    totalDisplay: "193 024",
                    segments: [
                      { value: 94582, color: COLOR_SPONTANEES, label: "Spontanées (49 %)" },
                      { value: 75000, color: COLOR_REPONSE, label: "Sur offre" },
                      { value: 23442, color: COLOR_REDIRECTION, label: "Redirection" },
                    ],
                  },
                  {
                    label: "T1 2026",
                    totalDisplay: "319 768",
                    highlighted: true,
                    segments: [
                      { value: 236628, color: COLOR_SPONTANEES, label: "Spontanées (74 %)" },
                      { value: 60000, color: COLOR_REPONSE, label: "Sur offre" },
                      { value: 23140, color: COLOR_REDIRECTION, label: "Redirection" },
                    ],
                  },
                ]}
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

              <BarChartHorizontal
                title="Top 10 secteurs les plus sollicités en candidature spontanée — premier trimestre 2026"
                items={[
                  { label: "Commerce de détail de produits pharmaceutiques en magasin spécialisé", value: 9060, displayValue: "9 060 (3,8 %)" },
                  { label: "Accueil de jeunes enfants", value: 8375, displayValue: "8 375 (3,5 %)" },
                  { label: "Activités comptables", value: 7857, displayValue: "7 857 (3,3 %)" },
                  { label: "Action sociale sans hébergement n.c.a.", value: 7813, displayValue: "7 813 (3,3 %)" },
                  { label: "Activités hospitalières", value: 6439, displayValue: "6 439 (2,7 %)" },
                  { label: "Pratique dentaire", value: 6062, displayValue: "6 062 (2,6 %)" },
                  { label: "Agences immobilières", value: 5632, displayValue: "5 632 (2,4 %)" },
                  { label: "Conseil en systèmes et logiciels informatiques", value: 4763, displayValue: "4 763 (2,0 %)" },
                  { label: "Administration publique générale", value: 3763, displayValue: "3 763 (1,6 %)" },
                  { label: "Activités juridiques", value: 3658, displayValue: "3 658 (1,5 %)" },
                ]}
                tone="success"
              />

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
