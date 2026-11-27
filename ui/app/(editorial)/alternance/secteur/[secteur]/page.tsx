import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { cacheLife } from "next/cache"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { buildSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import { formatNumber, seoCardSx, seoH2Sx, seoHrSx, seoSectionSx, seoStatBoxSx, seoThreeColGridSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import { JobsCtaTracked } from "@/app/(editorial)/alternance/_components/JobsCtaTracked"
import { buildOffresItemList } from "@/app/(editorial)/alternance/_components/offres-item-list"
import { secteurData } from "@/app/(editorial)/alternance/_components/secteur_data"
import { SalaireSection } from "@/app/(editorial)/alternance/diplome/[slug]/_components/SalaireSection"
import { DescriptionSecteurSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/DescriptionSecteurSection"
import { FormationsSecteurSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/FormationsSecteurSection"
import { MarcheSecteurSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/MarcheSecteurSection"
import { MetiersSecteurSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/MetiersSecteurSection"
import { OffresEtCandidaturesSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/OffresEtCandidaturesSection"
import { VillesSecteurSection } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/VillesSecteurSection"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import { SchemaOrg } from "@/components/SchemaOrg"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const UTM_PARAMS = "utm_source=lba&utm_medium=website&utm_campaign=lba_seo-prog-secteurs"

async function fetchSecteurData(secteur: string) {
  // `apiGet` lit `headers()` : seul `"use cache: private"` l'autorise (cf. page métier).
  "use cache: private"
  cacheLife("hours")
  return apiGet("/_private/seo/secteur/:secteur", { params: { secteur } })
}

export async function generateMetadata({ params }: { params: Promise<{ secteur: string }> }): Promise<Metadata> {
  const { secteur } = await params
  const data = await fetchSecteurData(secteur)

  if (!data) {
    return { title: "Alternance par secteur | La bonne alternance" }
  }

  return {
    title: `Alternance ${data.secteur} : ${data.job_count ?? 0} offres et ${data.company_count ?? 0} entreprises qui recrutent | La bonne alternance`,
    description: data.meta_description,
    // Une page sans offre ne doit pas être indexée tant que le calcul n'a rien trouvé.
    ...(data.job_count ? {} : { robots: { index: false } }),
  }
}

// Hauteur d'écran réservée pendant le streaming du contenu : évite que le pied de page ne saute à son arrivée (#5759)
export default function Secteur({ params }: { params: Promise<{ secteur: string }> }) {
  return (
    <Suspense fallback={<LoadingEmptySpace />}>
      <SecteurContent params={params} />
    </Suspense>
  )
}

async function SecteurContent({ params }: { params: Promise<{ secteur: string }> }) {
  const { secteur } = await params
  const data = await fetchSecteurData(secteur)

  if (!data) {
    notFound()
  }

  const searchBase = { q: data.q_recherche, radius: 30, page: 0, hitsPerPage: 20 }
  const offresSearchUrl = `${buildSearchUrl({ ...searchBase, mode: "emplois", is_algo_company: [false] })}&${UTM_PARAMS}`
  const candidaturesSearchUrl = `${buildSearchUrl({ ...searchBase, mode: "emplois", is_algo_company: [true] })}&${UTM_PARAMS}`
  const formationsSearchUrl = `${buildSearchUrl({ ...searchBase, mode: "formations" })}&${UTM_PARAMS}`

  const label = data.secteur.charAt(0).toUpperCase() + data.secteur.slice(1)
  const secteurPage = PAGES.dynamic.seoSecteur(data.slug, label)
  const breadcrumbs = [
    { name: "Accueil", url: PAGES.static.home.getPath() },
    { name: PAGES.static.alternanceSecteurs.title, url: PAGES.static.alternanceSecteurs.getPath() },
    { name: label, url: secteurPage.getPath() },
  ]

  const cards = data.cards ?? []
  const entreprises = data.entreprises ?? []
  const villes = data.villes ?? []
  const offresItemList = buildOffresItemList(cards)
  const faqItems = data.faq.map(({ question, reponse }) => ({ question, answer: reponse }))
  const autresSecteurs = secteurData.filter((s) => s.slug !== data.slug)

  // Une tuile à 0 ferait vide (ex. aucune candidature récente) : on ne la montre pas, comme les blocs vides.
  const statItems = [
    { icon: "/images/seo/malette.svg", value: data.job_count ?? 0, label: "offres d'emploi en alternance" },
    { icon: "/images/seo/usine.svg", value: data.company_count ?? 0, label: "entreprises qui recrutent activement" },
    { icon: "/images/seo/candidature-spontanee.svg", value: data.algo_company_count ?? 0, label: "entreprises à qui envoyer une candidature spontanée" },
    { icon: "/images/seo/metier/ecosystem.svg", value: data.applicant_count ?? 0, label: "candidats sur les 3 derniers mois" },
  ].filter((item) => item.value > 0)

  return (
    <Box>
      <SchemaOrg type="WebPage" title={data.titre} description={data.meta_description} url={secteurPage.getPath()} breadcrumbs={breadcrumbs} />
      {offresItemList.length > 0 && (
        <SchemaOrg
          type="ItemList"
          title={`Offres en alternance en ${data.secteur}`}
          description={`Sélection d'offres d'alternance dans le secteur ${data.secteur}.`}
          url={secteurPage.getPath()}
          breadcrumbs={breadcrumbs}
          itemList={offresItemList}
          omitBreadcrumb
        />
      )}
      {faqItems.length > 0 && (
        <SchemaOrg
          type="FAQPage"
          title={`Questions fréquentes sur l'alternance en ${data.secteur}`}
          description={data.meta_description}
          url={secteurPage.getPath()}
          breadcrumbs={breadcrumbs}
          faqItems={faqItems}
          omitBreadcrumb
        />
      )}
      <Breadcrumb pages={[PAGES.static.alternanceSecteurs, secteurPage]} />

      <DefaultContainer sx={{ px: 0 }}>
        {/* EN-TÊTE */}
        <Box
          sx={{
            position: "relative",
            px: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            py: fr.spacing("8v"),
            marginTop: { xs: 0, sm: fr.spacing("8v") },
            marginBottom: fr.spacing("8v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          <Box sx={{ position: "absolute", top: "20px", left: 0, width: "100%", display: { xs: "none", md: "block" } }}>
            <HomeCircleImageDecoration size="small" />
          </Box>
          <Box sx={{ position: "relative" }}>
            <Typography component="h1" variant="h1" sx={{ mb: fr.spacing("4v") }}>
              Alternance{" "}
              <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
                {data.secteur}
              </Typography>
            </Typography>
            <Typography sx={{ mb: fr.spacing("8v"), fontSize: "1.25rem" }}>{data.accroche}</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.max(statItems.length, 1)}, minmax(0, 1fr))` },
                gap: fr.spacing("4v"),
              }}
            >
              {statItems.map(({ icon, value, label: statLabel }) => (
                <Box key={statLabel} sx={seoStatBoxSx}>
                  <Image alt="" aria-hidden="true" src={icon} width={80} height={80} />
                  <Typography sx={{ mt: fr.spacing("1v"), fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                    {formatNumber(value)}
                  </Typography>
                  <Typography sx={{ mt: fr.spacing("4v"), fontSize: { xs: "1.125rem", md: "1.25rem" }, fontWeight: "bold", lineHeight: 1.2, color: "#161616" }}>
                    {statLabel}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <DescriptionSecteurSection secteur_complement={data.secteur_complement} description={data.description} chiffres_cles={data.chiffres_cles} />

        <MetiersSecteurSection secteur={data.secteur} metiers={data.metiers} metiers_counts={data.metiers_counts} utmParams={UTM_PARAMS} />

        <MarcheSecteurSection secteur={data.secteur} marche={data.marche} job_count={data.job_count} total_job_count={data.total_job_count} company_count={data.company_count} />

        <OffresEtCandidaturesSection
          secteur={data.secteur}
          job_count={data.job_count}
          algo_company_count={data.algo_company_count}
          cards={cards}
          offresSearchUrl={offresSearchUrl}
          candidaturesSearchUrl={candidaturesSearchUrl}
          utmParams={UTM_PARAMS}
        />

        {/* ENTREPRISES */}
        {entreprises.length > 0 && (
          <Box sx={seoSectionSx}>
            <Typography component="h2" variant="h2" sx={seoH2Sx}>
              Entreprises qui recrutent en alternance en {data.secteur}
            </Typography>
            <Box aria-hidden="true" component="hr" sx={seoHrSx} />
            <Box sx={seoThreeColGridSx}>
              {entreprises.map((entreprise) => (
                <Box key={entreprise.nom} sx={seoCardSx}>
                  <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold", color: fr.colors.decisions.background.actionHigh.blueFrance.default }}>{entreprise.nom}</Typography>
                  <Typography sx={{ mt: fr.spacing("1v"), color: fr.colors.decisions.text.label.grey.default }}>{formatNumber(entreprise.job_count)} postes</Typography>
                </Box>
              ))}
            </Box>
            {/* Les entreprises n'ont pas d'identifiant à lier : le bouton mène aux offres du secteur, comme sur la page métier. */}
            {data.job_count ? (
              <Box sx={{ mt: fr.spacing("6v"), textAlign: "center" }}>
                <JobsCtaTracked href={offresSearchUrl} searchOrigin="page_secteur" searchJobName={data.secteur} size="large">
                  Voir les offres de ces entreprises
                </JobsCtaTracked>
              </Box>
            ) : null}
          </Box>
        )}

        <VillesSecteurSection secteur={data.secteur} villes={villes} q_recherche={data.q_recherche} utmParams={UTM_PARAMS} />

        <FormationsSecteurSection secteur={data.secteur} formations_niveaux={data.formations_niveaux} formations={data.formations} formationsSearchUrl={formationsSearchUrl} />

        <SalaireSection
          utmParams={UTM_PARAMS}
          titre={
            <>
              Combien gagne un alternant en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.secteur}</span> ?
            </>
          }
        />

        {/* FAQ */}
        {faqItems.length > 0 && (
          <Box sx={seoSectionSx}>
            <Typography component="h2" variant="h2" sx={seoH2Sx}>
              Questions fréquentes sur l'alternance en {data.secteur}
            </Typography>
            <Box aria-hidden="true" component="hr" sx={seoHrSx} />
            <Box sx={{ mt: fr.spacing("4v") }}>
              {faqItems.map((item, idx) => (
                <Accordion key={item.question} label={item.question} defaultExpanded={idx === 0}>
                  <Typography>{item.answer}</Typography>
                </Accordion>
              ))}
            </Box>
          </Box>
        )}

        {/* AUTRES SECTEURS */}
        {autresSecteurs.length > 0 && (
          <Box sx={seoSectionSx}>
            <Typography component="h2" variant="h2" sx={seoH2Sx}>
              Autres secteurs en alternance
            </Typography>
            <Box aria-hidden="true" component="hr" sx={seoHrSx} />
            <Box component="ul" sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v"), listStyle: "none", pl: 0 }}>
              {autresSecteurs.map((s) => (
                <li key={s.slug}>
                  <Link href={PAGES.dynamic.seoSecteur(s.slug).getPath()} className={fr.cx("fr-link")}>
                    Alternance {s.secteur.toLowerCase()}
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        )}
      </DefaultContainer>
    </Box>
  )
}
