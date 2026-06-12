import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Grid, Typography } from "@mui/material"
import type { Metadata } from "next"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { AllerPlusLoinItem } from "@/app/(editorial)/_components/AllerPlusLoinItem"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { accentSx, cardArrowSx, cardLinkStyle, cardSubtitleSx, cardTitleSx, formatLong, kpiCardSx, listicleCardSx } from "@/app/(editorial)/alternance/_components/hubStyles"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { SectionTitle } from "@/app/(editorial)/alternance/_components/SectionTitle"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { SchemaOrg } from "@/components/SchemaOrg"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.alternanceMetiers.getMetadata().title,
  description: PAGES.static.alternanceMetiers.getMetadata().description,
}

const faqItems = [
  {
    question: "Quels sont les métiers qui recrutent le plus en alternance en France ?",
    answer:
      "En 2026, les familles de métiers les plus porteuses en alternance sont les fonctions support du tertiaire (comptabilité, gestion, RH, administration), les métiers du numérique (développement web, data, cybersécurité), les métiers du soin et du médico-social, ainsi que l'artisanat. Ces secteurs offrent à la fois un volume d'offres élevé, des salaires attractifs (1 000 à 1 200 € brut/mois en alternance) et des perspectives d'embauche durable.",
  },
  {
    question: "Comment trouver une alternance dans le métier qui m'intéresse ?",
    answer:
      "Cliquez sur le métier souhaité dans la liste ci-dessous : vous accéderez à toutes les offres d'alternance disponibles, les entreprises qui recrutent activement, les formations associées (BTS, BUT, Licence Pro, Master) et le salaire moyen pour ce métier. Vous pouvez aussi affiner par ville pour cibler votre zone géographique.",
  },
  {
    question: "Quel est le salaire d'un alternant en France ?",
    answer:
      "Le salaire d'un alternant dépend de son âge et de son année de formation. En contrat d'apprentissage, il varie de 27 % du SMIC (moins de 18 ans, 1re année) à 100 % du SMIC (26 ans et plus, dernière année). Le salaire moyen constaté sur La bonne alternance est d'environ 1 050 € brut/mois, tous métiers confondus.",
  },
  {
    question: "Quelle est la différence entre contrat d'apprentissage et contrat de professionnalisation ?",
    answer:
      "Les deux contrats permettent d'alterner formation et travail en entreprise. Le contrat d'apprentissage cible principalement les jeunes de 16 à 29 ans (avec des exceptions sans limite d'âge pour les travailleurs reconnus handicapés, les sportifs de haut niveau, et jusqu'à 34 ans pour les créateurs ou repreneurs d'entreprise). Il mène à un diplôme reconnu par l'État (CAP, BTS, Licence Pro, Master…). Le contrat de professionnalisation est ouvert plus largement et vise une qualification professionnelle (titre RNCP, certification). La bonne alternance liste les offres des deux types.",
  },
  {
    question: "Est-ce qu'on peut faire une alternance sans avoir trouvé d'entreprise ?",
    answer:
      "Non, l'alternance nécessite obligatoirement un contrat signé avec une entreprise. C'est précisément pour faciliter cette mise en relation que La bonne alternance a été créé : nous référençons à la fois les offres publiées par les entreprises et les sociétés qui recrutent régulièrement en alternance, même sans offre déclarée, pour vous permettre d'envoyer des candidatures spontanées ciblées.",
  },
]

export default function AlternanceMetiers() {
  const url = PAGES.static.alternanceMetiers.getPath()
  const meta = PAGES.static.alternanceMetiers.getMetadata?.() ?? { title: PAGES.static.alternanceMetiers.title, description: "" }
  const breadcrumbs = [
    { name: "Accueil", url: "/" },
    { name: "Métiers en alternance", url },
  ]
  const itemList = metierData.map((m) => ({
    name: `${m.metier} en alternance`,
    url: PAGES.dynamic.seoMetier(m.slug).getPath(),
  }))

  const metiersHighlight = metierData.slice(0, 3)
  const villesHighlight = villeData.slice(0, 6)
  const diplomesHighlight = diplomeData.slice(0, 6)

  const metierComptable = metierData.find((m) => m.slug === "comptable")
  const metierDevWeb = metierData.find((m) => m.slug === "developpeur-web")
  const metierAideSoignant = metierData.find((m) => m.slug === "aide-soignant")
  const metierCoiffeur = metierData.find((m) => m.slug === "coiffeur")

  const kpiCards = [
    { value: `${metierData.length}`, label: "métiers détaillés" },
    { value: "12 000+", label: "offres d'alternance", source: "Offres référencées au moment de la consultation" },
    { value: "1 050 €", label: "salaire brut moyen / mois", source: "Salaire moyen constaté sur La bonne alternance, 2025-2026" },
    { value: "16-29 ans", label: "âge éligible à l'apprentissage", source: "Sans limite d'âge pour les personnes en situation de handicap (RQTH)" },
  ]

  return (
    <Box>
      <SchemaOrg type="CollectionPage" title={meta.title ?? ""} description={meta.description ?? ""} url={url} breadcrumbs={breadcrumbs} />
      <SchemaOrg
        type="ItemList"
        title={`Liste des ${metierData.length} métiers accessibles en alternance`}
        description={`Annuaire des ${metierData.length} métiers les plus recherchés en alternance sur La bonne alternance.`}
        url={url}
        breadcrumbs={breadcrumbs}
        itemList={itemList}
        omitBreadcrumb
      />
      <SchemaOrg
        type="FAQPage"
        title="Questions fréquentes sur les métiers en alternance"
        description="Toutes les réponses sur les métiers, salaires, contrats et diplômes en alternance."
        url={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        omitBreadcrumb
      />

      <Breadcrumb pages={[PAGES.static.alternanceMetiers]} />

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
            Tous les métiers accessibles en alternance
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
            L'alternance permet de préparer un diplôme tout en travaillant en entreprise, dans presque tous les secteurs en France. La bonne alternance recense {metierData.length}{" "}
            métiers porteurs avec leurs offres, leurs entreprises et leurs formations. Voici comment choisir le vôtre.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v"), fontSize: "1.125rem" }}>
            <strong>{metierData.length} métiers en alternance</strong> à explorer sur La bonne alternance, des métiers du tertiaire aux métiers du numérique, en passant par le
            médico-social et l'artisanat. Pour chaque métier, retrouvez les offres d'alternance disponibles, les entreprises qui recrutent activement, le salaire brut mensuel moyen
            pratiqué en contrat d'apprentissage ou de professionnalisation, ainsi que les formations associées (CAP, BTS, BUT, Licence Pro, Master).
          </Typography>
          <Typography component="p" sx={{ fontSize: "1.125rem" }}>
            La bonne alternance est le service public officiel qui simplifie la mise en relation entre les jeunes, les centres de formation (CFA) et les entreprises. Notre objectif
            : vous aider à trouver l'alternance qui correspond à votre projet professionnel, partout en France.
          </Typography>

          {/* KPI cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: fr.spacing("4v"),
              mt: fr.spacing("6v"),
            }}
          >
            {kpiCards.map((kpi) => (
              <Box key={kpi.label} sx={kpiCardSx}>
                <Typography
                  sx={{
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                    fontWeight: 700,
                    color: fr.colors.decisions.text.default.info.default,
                    lineHeight: 1.1,
                  }}
                >
                  {kpi.value}
                </Typography>
                <Typography sx={{ mt: fr.spacing("1v"), fontSize: "0.95rem", fontWeight: 700 }}>{kpi.label}</Typography>
                {kpi.source ? (
                  <Typography
                    component="span"
                    sx={{ mt: fr.spacing("1v"), fontSize: "0.75rem", fontStyle: "italic", color: fr.colors.decisions.text.mention.grey.default, lineHeight: 1.3 }}
                  >
                    {kpi.source}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>
        </Box>

        {/* DERNIERE MISE A JOUR */}
        <Typography sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          Dernière mise à jour : mai 2026 · Source : La bonne alternance, service public de l'alternance (DGEFP)
        </Typography>

        {/* EDITO QUESTION */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title="Quelles familles de métiers recrutent en alternance ?"
            description="L'alternance couvre la quasi-totalité des secteurs économiques. Quatre grandes familles concentrent aujourd'hui l'essentiel des offres en France."
          />
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            Dans le{" "}
            <Typography component="span" sx={accentSx}>
              secteur tertiaire
            </Typography>
            , les fonctions support —{" "}
            {metierComptable ? (
              <Link href={PAGES.dynamic.seoMetier(metierComptable.slug).getPath()} className={fr.cx("fr-link")}>
                comptabilité
              </Link>
            ) : (
              "comptabilité"
            )}
            , contrôle de gestion, gestion de paie, administration et ressources humaines — sont des viviers historiques de l'alternance : volumes d'offres élevés, entrée
            accessible dès le BTS, débouchés stables dans tous types de structures (PME, grands groupes, cabinets, secteur public). C'est souvent par ces fonctions que les jeunes
            diplômés entrent en entreprise et y construisent une carrière durable.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            Côté{" "}
            <Typography component="span" sx={accentSx}>
              numérique
            </Typography>
            , l'explosion des besoins en compétences techniques tire fortement la demande :{" "}
            {metierDevWeb ? (
              <Link href={PAGES.dynamic.seoMetier(metierDevWeb.slug).getPath()} className={fr.cx("fr-link")}>
                développement web
              </Link>
            ) : (
              "développement web"
            )}
            , data, cybersécurité figurent parmi les profils les plus convoités par les entreprises, avec à la clé des salaires d'alternant souvent supérieurs à la moyenne et des
            taux d'embauche post-formation parmi les meilleurs du marché. L'alternance y est devenue la voie royale, alternative crédible aux formations 100 % académiques.
          </Typography>
          <Typography component="p" sx={{ mb: fr.spacing("3v") }}>
            Les{" "}
            <Typography component="span" sx={accentSx}>
              métiers du soin et du médico-social
            </Typography>{" "}
            restent des secteurs prioritaires : la France manque structurellement de professionnels dans la santé, la petite enfance et l'accompagnement social. L'alternance
            constitue ici la voie d'entrée privilégiée — par exemple pour devenir{" "}
            {metierAideSoignant ? (
              <Link href={PAGES.dynamic.seoMetier(metierAideSoignant.slug).getPath()} className={fr.cx("fr-link")}>
                aide-soignant
              </Link>
            ) : (
              "aide-soignant"
            )}{" "}
            —, soutenue par des financements publics et un fort engagement des employeurs (hôpitaux, EHPAD, crèches, structures associatives).
          </Typography>
          <Typography component="p">
            Enfin,{" "}
            <Typography component="span" sx={accentSx}>
              l'artisanat et les métiers manuels
            </Typography>{" "}
            offrent toujours d'excellentes perspectives, du métier de{" "}
            {metierCoiffeur ? (
              <Link href={PAGES.dynamic.seoMetier(metierCoiffeur.slug).getPath()} className={fr.cx("fr-link")}>
                coiffeur
              </Link>
            ) : (
              "coiffeur"
            )}{" "}
            à celui de pâtissier ou d'électricien. La transmission entre maître d'apprentissage et apprenti reste le socle de la formation, et nombre d'apprentis y trouvent à la
            fois un métier de passion et la possibilité, à terme, de reprendre ou créer leur propre entreprise.
          </Typography>
        </Box>

        {/* LISTICLE MÉTIERS */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle
            title={`Quels métiers préparer en alternance ? Les ${metierData.length} fiches à explorer`}
            description="Cliquez sur un métier pour accéder à toutes les offres, formations et entreprises qui recrutent en alternance dans ce secteur."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: fr.spacing("3v"),
            }}
          >
            {metierData.map((m) => (
              <Link key={m.slug} href={PAGES.dynamic.seoMetier(m.slug).getPath()} aria-label={`Voir les offres d'alternance ${m.metier}`} style={cardLinkStyle}>
                <Box sx={listicleCardSx}>
                  <Box>
                    <Typography sx={cardTitleSx}>{m.metier}</Typography>
                  </Box>
                  <ArrowRightLine sx={cardArrowSx} />
                </Box>
              </Link>
            ))}
          </Box>
        </Box>

        {/* CROSS LINK ENRICHI */}
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
            description={`Le métier n'est pas la seule porte d'entrée. Vous pouvez aussi commencer votre recherche par la ville où vous souhaitez étudier et travailler${metiersHighlight.length > 0 ? ` (${metiersHighlight.map((m) => m.metier).join(", ")}…)` : ""}, ou par le diplôme que vous préparez.`}
          />

          {/* Par ville */}
          <Box sx={{ mb: fr.spacing("8v") }}>
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: "24px",
                lineHeight: "32px",
                color: fr.colors.decisions.text.title.grey.default,
                mb: fr.spacing("4v"),
              }}
            >
              Par ville
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: fr.spacing("3v"),
                mb: fr.spacing("4v"),
              }}
            >
              {villesHighlight.map((v) => (
                <Link key={v.slug} href={PAGES.dynamic.seoVille(v.slug).getPath()} aria-label={`Voir l'alternance à ${v.ville}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Box>
                      <Typography sx={cardTitleSx}>Alternance à {v.ville}</Typography>
                    </Box>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceVilles.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir toutes les villes
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
                color: fr.colors.decisions.text.title.grey.default,
                mb: fr.spacing("4v"),
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
                <Link key={d.slug} href={PAGES.dynamic.seoDiplome(d.slug).getPath()} aria-label={`Voir l'alternance ${d.titre}`} style={cardLinkStyle}>
                  <Box sx={listicleCardSx}>
                    <Box>
                      <Typography sx={cardTitleSx}>{d.titre}</Typography>
                      <Typography sx={cardSubtitleSx}>{formatLong(d.intituleLongFormation)}</Typography>
                    </Box>
                    <ArrowRightLine sx={cardArrowSx} />
                  </Box>
                </Link>
              ))}
            </Box>
            <Link href={PAGES.static.alternanceDiplomes.getPath()} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
              Voir tous les diplômes
            </Link>
          </Box>
        </Box>

        {/* FAQ */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Questions fréquentes" description="Tout ce qu'il faut savoir avant de se lancer en alternance." />
          <Box sx={{ mt: fr.spacing("4v") }}>
            {faqItems.map((item, idx) => (
              <Accordion key={item.question} label={item.question} defaultExpanded={idx === 0}>
                <Typography>{item.answer}</Typography>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* RESSOURCES */}
        <Box sx={{ mb: fr.spacing("10v"), px: { xs: fr.spacing("2v"), md: 0 } }}>
          <SectionTitle title="Ressources pour réussir votre projet d'alternance" description="Guides pratiques, outils et points d'entrée complémentaires." />
          <Grid container spacing={fr.spacing("4v")} sx={{ mt: fr.spacing("2v"), "& .fr-card__end": { display: "none" } }}>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Guide complet de l'alternant"
                description="Toutes les clés pour choisir son métier, décrocher un contrat, comprendre ses droits et bien démarrer son alternance en entreprise."
                imageUrl="/images/guides/guide-alternant/preparer-son-projet-en-alternance.svg"
                path={PAGES.static.guideAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Calculer son salaire"
                description="Estimez votre rémunération nette mensuelle selon votre âge, votre année de formation et votre type de contrat d'alternance."
                imageUrl="/images/guides/guide-alternant/simulateur.svg"
                path={PAGES.static.salaireAlternant.getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Rechercher une offre"
                description="Trouvez les offres d'alternance qui correspondent à votre projet : par métier, par ville et par niveau d'études."
                imageUrl="/images/guides/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur.svg"
                path={PAGES.dynamic.recherche({}).getPath()}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <AllerPlusLoinItem
                title="Foire aux questions"
                description="Toutes les réponses aux questions les plus fréquentes sur l'alternance : démarches, contrat, rémunération et accompagnement."
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
