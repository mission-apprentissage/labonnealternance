import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { AllerPlusLoinItem } from "@/app/(editorial)/_components/AllerPlusLoinItem"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { accentSx, cardArrowSx, cardLinkStyle, cardSubtitleSx, cardTitleSx, kpiCardSx, listicleCardSx } from "@/app/(editorial)/alternance/_components/hubStyles"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { SectionTitle } from "@/app/(editorial)/alternance/_components/SectionTitle"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { SchemaOrg } from "@/components/SchemaOrg"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.alternanceVilles.getMetadata().title,
  description: PAGES.static.alternanceVilles.getMetadata().description,
}

const faqItems = [
  {
    question: "Quelles sont les meilleures villes pour faire une alternance en France ?",
    answer:
      "Les grandes métropoles concentrent les plus gros volumes d'offres d'alternance grâce à leur tissu économique dense, tandis que les capitales régionales et les villes moyennes offrent souvent un excellent compromis entre qualité de vie, coût du logement et opportunités professionnelles. Le choix de votre ville d'alternance dépend avant tout de votre secteur d'activité, de votre budget logement et de vos préférences personnelles en termes de cadre de vie.",
  },
  {
    question: "Comment se loger pendant son alternance dans une grande ville ?",
    answer:
      "Plusieurs solutions existent : résidences étudiantes CROUS (priorité aux boursiers, loyers modérés), résidences privées spécialisées alternants, colocations (souvent l'option la moins chère) ou foyers de jeunes travailleurs (FJT). L'aide Mobili-Jeune d'Action Logement peut financer jusqu'à 100 €/mois de loyer pour les alternants de moins de 30 ans. Sur les pages ville de La bonne alternance, vous trouverez les fourchettes de loyers locales (studio, T2, colocation).",
  },
  {
    question: "L'alternance à Paris est-elle vraiment plus rémunératrice qu'en région ?",
    answer:
      "Le salaire d'alternant est calculé en pourcentage du SMIC, identique partout en France. À diplôme et âge équivalents, un alternant en Île-de-France ne gagne donc pas plus qu'en région. En revanche, le coût de la vie parisien (loyer x2 à x3 vs province) absorbe largement cet apparent équilibre. Les pages ville détaillent les loyers moyens et les opportunités locales pour vous aider à choisir.",
  },
  {
    question: "Peut-on faire une alternance loin de son domicile familial ?",
    answer:
      "Oui, c'est même fréquent : beaucoup d'alternants déménagent pour rejoindre l'entreprise ou le CFA qui les forme. Des aides à la mobilité existent — Mobili-Jeune d'Action Logement pour le loyer, dispositifs Loca-Pass et FAJ (Fonds d'aide aux jeunes) pour l'installation, aides régionales au transport. La bonne alternance propose pour chaque ville un focus sur les transports, le logement et la vie d'alternant pour faciliter votre installation.",
  },
  {
    question: "Quelles aides financières pour la mobilité en alternance ?",
    answer:
      "Plusieurs dispositifs existent pour les alternants : (1) Mobili-Jeune (Action Logement) : 10 à 100 €/mois de loyer pendant 1 an, pour les moins de 30 ans sous conditions de ressources ; (2) Loca-Pass et Fonds d'aide aux jeunes (FAJ) pour financer le dépôt de garantie ou l'installation ; (3) Aides régionales au transport (cartes TER, abonnements à tarif réduit). Renseignez-vous auprès de votre région et d'Action Logement pour les conditions exactes en vigueur.",
  },
  {
    question: "Comment choisir entre une grande ville et une ville moyenne pour son alternance ?",
    answer:
      "Les grandes métropoles offrent plus d'offres et une variété sectorielle plus large, mais avec une concurrence plus forte et un coût de la vie élevé. Les villes moyennes ont souvent un taux de réussite à la signature de contrat plus élevé et un meilleur ratio offres/candidats sur certains métiers, avec des loyers plus accessibles. Consultez les pages ville pour voir le nombre d'offres et d'entreprises qui recrutent localement.",
  },
]

export default function AlternanceVilles() {
  const url = PAGES.static.alternanceVilles.getPath()
  const meta = PAGES.static.alternanceVilles.getMetadata?.() ?? { title: PAGES.static.alternanceVilles.title, description: "" }
  const breadcrumbs = [
    { name: "Accueil", url: "/" },
    { name: "Alternance dans les grandes villes", url },
  ]
  const itemList = villeData.map((v) => ({
    name: `Alternance à ${v.ville}`,
    url: PAGES.dynamic.seoVille(v.slug).getPath(),
  }))

  const kpiCards = [
    { value: `${villeData.length}`, label: "villes étudiantes couvertes" },
    { value: "70 %", label: "des offres dans les 10 plus grandes métropoles" },
    { value: "450 €", label: "loyer médian studio en province" },
    { value: "100 €/mois", label: "aide Mobili-Jeune au logement" },
  ]

  const metiersHighlight = metierData.slice(0, 6)
  const diplomesHighlight = diplomeData.slice(0, 6)

  const villeParis = villeData.find((v) => v.slug === "paris")
  const villeLyon = villeData.find((v) => v.slug === "lyon")
  const villeBordeaux = villeData.find((v) => v.slug === "bordeaux")
  const villeNantes = villeData.find((v) => v.slug === "nantes")
  const villeTours = villeData.find((v) => v.slug === "tours")
  const villeReims = villeData.find((v) => v.slug === "reims")

  const kpiSourceSx = {
    fontSize: "0.75rem",
    fontStyle: "italic" as const,
    color: fr.colors.decisions.text.mention.grey.default,
    mt: fr.spacing("1v"),
    lineHeight: 1.4,
  }

  return (
    <Box>
      <SchemaOrg type="CollectionPage" title={meta.title} description={meta.description} url={url} breadcrumbs={breadcrumbs} />
      <SchemaOrg
        type="ItemList"
        title={`Liste des ${villeData.length} villes étudiantes pour l'alternance`}
        description={`Annuaire des ${villeData.length} grandes villes françaises où trouver une alternance sur La bonne alternance.`}
        url={url}
        breadcrumbs={breadcrumbs}
        itemList={itemList}
        omitBreadcrumb
      />
      <SchemaOrg
        type="FAQPage"
        title="Questions fréquentes sur l'alternance en ville"
        description="Toutes les réponses sur le logement, la mobilité, les aides et le choix de la ville pour son alternance."
        url={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        omitBreadcrumb
      />

      <Breadcrumb pages={[PAGES.static.alternanceVilles]} />

      <DefaultContainer>
        {/* HERO */}
        <Box
          sx={{
            p: { xs: fr.spacing("4v"), md: fr.spacing("10v") },
            mb: fr.spacing("4v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: fr.spacing("4v") }}>
            Trouver une alternance dans les grandes villes
          </Typography>
          <Box
            component="hr"
            sx={{
              maxWidth: "93px",
              border: "none",
              borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`,
              opacity: 1,
              my: fr.spacing("4v"),
            }}
          />
          <Typography component="p" sx={{ mb: fr.spacing("3v"), fontSize: "1.125rem", fontWeight: 500 }}>
            Choisir sa ville d'alternance, c'est choisir son cadre de vie pour 1 à 3 ans. La bonne alternance référence {villeData.length} grandes villes françaises avec leurs
            offres, leurs entreprises et leur tissu économique. Voici comment trouver la vôtre.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v"), fontSize: "1.125rem", lineHeight: 1.6 }}>
            <strong>{villeData.length} grandes villes françaises</strong> pour faire votre alternance : des métropoles dominantes aux capitales régionales en passant par les villes
            moyennes à taille humaine. Pour chaque ville, retrouvez le nombre d'offres d'alternance disponibles, les entreprises qui recrutent, les loyers moyens (studio, T2,
            colocation), les transports, et un focus sur la vie d'alternant local.
          </Typography>
          <Typography component="p" sx={{ fontSize: "1.125rem", lineHeight: 1.6 }}>
            Tissu économique, coût du logement, transports, qualité de vie : tous ces facteurs comptent autant que l'offre elle-même. La bonne alternance vous donne les clés pour
            décider en connaissance de cause.
          </Typography>

          {/* KPI cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: fr.spacing("3v"),
              mt: fr.spacing("8v"),
            }}
          >
            {kpiCards.map((kpi) => (
              <Box key={kpi.label} sx={kpiCardSx}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "24px", md: "32px" },
                    lineHeight: { xs: "32px", md: "40px" },
                    color: fr.colors.decisions.text.default.info.default,
                  }}
                >
                  {kpi.value}
                </Typography>
                <Typography
                  sx={{ fontWeight: 700, fontSize: { xs: "14px", md: "16px" }, lineHeight: { xs: "20px", md: "22px" }, color: fr.colors.decisions.text.title.grey.default }}
                >
                  {kpi.label}
                </Typography>
                {kpi.value === "70 %" && <Typography sx={kpiSourceSx}>Estimation basée sur les offres référencées sur La bonne alternance</Typography>}
                {kpi.value === "450 €" && <Typography sx={kpiSourceSx}>Loyer médian observé en province (Locservice, 2025)</Typography>}
              </Box>
            ))}
          </Box>
        </Box>

        {/* DATE DE MISE A JOUR */}
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: fr.colors.decisions.text.mention.grey.default,
            mb: fr.spacing("4v"),
            px: { xs: fr.spacing("2v"), md: 0 },
          }}
        >
          Dernière mise à jour : mai 2026 · Source : La bonne alternance, service public de l'alternance (DGEFP)
        </Typography>

        {/* EDITO QUESTION */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Comment choisir sa ville pour son alternance ?" />
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            Trois grands profils de territoires se dégagent.{" "}
            <Typography component="span" sx={accentSx}>
              Les métropoles dominantes
            </Typography>{" "}
            (
            {villeParis && (
              <Link href={PAGES.dynamic.seoVille(villeParis.slug).getPath()} className={fr.cx("fr-link")}>
                Paris
              </Link>
            )}
            {villeParis && villeLyon && ", "}
            {villeLyon && (
              <Link href={PAGES.dynamic.seoVille(villeLyon.slug).getPath()} className={fr.cx("fr-link")}>
                Lyon
              </Link>
            )}
            ) concentrent à elles seules près de 70 % des offres d'alternance, tous secteurs confondus. C'est là que vous trouverez la plus large palette de métiers, du numérique à
            la finance en passant par les industries créatives. Contrepartie : coût du logement élevé (souvent 700-1 200 € pour un studio), concurrence forte entre candidats, et
            trajets domicile-CFA parfois longs.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Les capitales régionales dynamiques
            </Typography>{" "}
            comme{" "}
            {villeBordeaux && (
              <Link href={PAGES.dynamic.seoVille(villeBordeaux.slug).getPath()} className={fr.cx("fr-link")}>
                Bordeaux
              </Link>
            )}
            {villeBordeaux && villeNantes && " ou "}
            {villeNantes && (
              <Link href={PAGES.dynamic.seoVille(villeNantes.slug).getPath()} className={fr.cx("fr-link")}>
                Nantes
              </Link>
            )}{" "}
            offrent un excellent compromis : tissu d'entreprises riche, écosystèmes universitaires solides, transports performants, et coût de la vie plus raisonnable. Plusieurs
            sont reconnues pour leur excellence dans un domaine précis (numérique et recherche, santé, droit européen, industries…). Les loyers y oscillent généralement entre 450
            et 700 € pour un studio, et la mobilité urbaine y est souvent meilleure qu'en Île-de-France.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            <Typography component="span" sx={accentSx}>
              Les villes moyennes à taille humaine
            </Typography>{" "}
            comme{" "}
            {villeTours && (
              <Link href={PAGES.dynamic.seoVille(villeTours.slug).getPath()} className={fr.cx("fr-link")}>
                Tours
              </Link>
            )}
            {villeTours && villeReims && " ou "}
            {villeReims && (
              <Link href={PAGES.dynamic.seoVille(villeReims.slug).getPath()} className={fr.cx("fr-link")}>
                Reims
              </Link>
            )}{" "}
            ont souvent un ratio offres / candidats favorable. Les loyers y sont accessibles (250-450 € pour un studio), les déplacements courts, et la vie étudiante de qualité.
            Idéal pour bien démarrer sans s'endetter, à condition que votre secteur y soit représenté.
          </Typography>
          <Typography component="p">
            Notre conseil : ne raisonnez pas uniquement par la notoriété de la ville. Croisez la{" "}
            <Typography component="span" sx={accentSx}>
              demande de votre secteur
            </Typography>{" "}
            (utilisez les{" "}
            <Link href={PAGES.static.alternanceMetiers.getPath()} className={fr.cx("fr-link")}>
              pages métier
            </Link>{" "}
            pour voir où votre métier recrute le plus) avec votre{" "}
            <Typography component="span" sx={accentSx}>
              budget logement
            </Typography>{" "}
            et votre{" "}
            <Typography component="span" sx={accentSx}>
              proximité familiale
            </Typography>
            . Souvent, la bonne ville n'est pas la plus connue, c'est celle qui combine ces trois facteurs pour vous.
          </Typography>
        </Box>

        {/* LISTICLE VILLES */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title={`Où faire son alternance en France ? Les ${villeData.length} villes à explorer`}
            description="Cliquez sur une ville pour découvrir les offres d'alternance locales, les entreprises qui recrutent et la vie d'alternant sur place."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: fr.spacing("3v"),
            }}
          >
            {villeData.map((v) => (
              <Link key={v.slug} href={PAGES.dynamic.seoVille(v.slug).getPath()} aria-label={`Voir les offres d'alternance à ${v.ville}`} style={cardLinkStyle}>
                <Box sx={listicleCardSx}>
                  <Box>
                    <Typography sx={cardTitleSx}>Alternance à {v.ville}</Typography>
                    <Typography sx={cardSubtitleSx}>{v.cp}</Typography>
                  </Box>
                  <ArrowRightLine sx={cardArrowSx} />
                </Box>
              </Link>
            ))}
          </Box>
        </Box>

        {/* CROSS LINK enrichi */}
        <Box
          sx={{
            mb: fr.spacing("10v"),
            mx: { xs: fr.spacing("2v"), md: 0 },
            p: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <SectionTitle
            title="Explorer l'alternance autrement"
            description="La ville n'est qu'un angle d'approche. Si vous avez déjà une idée du métier ou du diplôme que vous voulez préparer, partez plutôt de là."
          />

          {/* Par métier */}
          <Box sx={{ mb: fr.spacing("8v") }}>
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "32px",
                mb: fr.spacing("4v"),
                color: fr.colors.decisions.text.title.grey.default,
              }}
            >
              Par métier
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: fr.spacing("3v"),
                mb: fr.spacing("4v"),
              }}
            >
              {metiersHighlight.map((m) => (
                <Link key={m.slug} href={PAGES.dynamic.seoMetier(m.slug).getPath()} aria-label={`Voir les offres d'alternance en ${m.metier}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Box>
                      <Typography sx={cardTitleSx}>Alternance {m.metier}</Typography>
                    </Box>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceMetiers.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir tous les métiers en alternance
            </Link>
          </Box>

          {/* Par diplôme */}
          <Box>
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "32px",
                mb: fr.spacing("4v"),
                color: fr.colors.decisions.text.title.grey.default,
              }}
            >
              Par diplôme
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: fr.spacing("3v"),
                mb: fr.spacing("4v"),
              }}
            >
              {diplomesHighlight.map((d) => (
                <Link key={d.slug} href={PAGES.dynamic.seoDiplome(d.slug).getPath()} aria-label={`Voir les offres d'alternance ${d.titre}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Box>
                      <Typography sx={cardTitleSx}>{d.titre} en alternance</Typography>
                    </Box>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceDiplomes.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir tous les diplômes en alternance
            </Link>
          </Box>
        </Box>

        {/* FAQ */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Questions fréquentes sur l'alternance en ville" />
          <Box sx={{ mt: fr.spacing("4v") }}>
            {faqItems.map((item, index) => (
              <Accordion key={item.question} label={item.question} defaultExpanded={index === 0}>
                <Typography>{item.answer}</Typography>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* RESSOURCES */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title="Ressources pour réussir son alternance en ville"
            description="Guides pratiques, outils et points d'entrée complémentaires pour bien préparer votre installation."
          />
          <Grid container spacing={fr.spacing("4v")} sx={{ mt: fr.spacing("2v"), "& .fr-card__end": { display: "none" } }}>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Guide complet de l'alternant"
                description="Toutes les clés pour préparer son projet, son installation et son intégration dans une nouvelle ville étudiante."
                imageUrl="/images/guides/guide-alternant/preparer-son-projet-en-alternance.svg"
                path={PAGES.static.guideAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Calculer son salaire"
                description="Estimez votre rémunération nette mensuelle selon votre âge et votre année de formation, identique partout en France."
                imageUrl="/images/guides/guide-alternant/simulateur.svg"
                path={PAGES.static.salaireAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Rechercher une offre"
                description="Trouvez les offres d'alternance disponibles dans votre ville cible, par secteur et par niveau d'études."
                imageUrl="/images/guides/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur.svg"
                path={PAGES.dynamic.recherche({}).getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Foire aux questions"
                description="Toutes les réponses sur le logement étudiant, les aides à la mobilité, le choix de la ville et l'installation."
                imageUrl="/images/guides/faq.svg"
                path={PAGES.static.faq.getPath()}
              />
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
