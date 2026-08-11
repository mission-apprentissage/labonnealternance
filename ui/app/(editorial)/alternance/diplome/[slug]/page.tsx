import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"
import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { ISeoDiplome } from "shared/models/seo-diplome.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
import { buildOffresItemList } from "@/app/(editorial)/alternance/_components/offres-item-list"
import { UTM_PARAMS } from "@/app/(editorial)/alternance/diplome/[slug]/_data/constants"
import { SchemaOrg } from "@/components/SchemaOrg"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { DescriptionDiplome } from "./_components/DescriptionDiplome"
import { EcolesSection } from "./_components/EcolesSection"
import { ExplorerDiplomesSection } from "./_components/ExplorerDiplomesSection"
import { HeroDiplome } from "./_components/HeroDiplome"
import { MetiersSection } from "./_components/MetiersSection"
import { OffresSection } from "./_components/OffresSection"
import { PreparationSection } from "./_components/PreparationSection"
import { ProgrammeDiplome } from "./_components/ProgrammeDiplome"
import { SalaireSection } from "./_components/SalaireSection"

async function getDiplomeData(slug: string) {
  // `apiGet` lit toujours `headers()` en interne (transmission du cookie de session),
  // incompatible avec un `"use cache"` classique — seul `"use cache: private"` l'autorise.
  "use cache: private"
  cacheLife("hours")
  return await apiGet("/_private/seo/diplome/:diplome", { params: { diplome: slug } })
}

export function generateStaticParams() {
  return diplomeData.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getDiplomeData(slug)
  if (!data) return {}

  return {
    title: `${data.titre} | La bonne alternance`,
    description: `Découvrez le ${data.titre} : programme, prérequis, salaire, entreprises qui recrutent et perspectives d'emploi. Trouvez votre alternance sur La bonne alternance.`,
  }
}

export default function DiplomePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <DiplomeContent params={params} />
    </Suspense>
  )
}

async function DiplomeContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rawData = await getDiplomeData(slug)

  if (!rawData) notFound()

  const data = rawData as unknown as ISeoDiplome

  const diplomePage = PAGES.dynamic.seoDiplome(slug, data.titre)
  const breadcrumbs = [
    { name: "Accueil", url: PAGES.static.home.getPath() },
    { name: PAGES.static.alternanceDiplomes.title, url: PAGES.static.alternanceDiplomes.getPath() },
    { name: data.titre, url: diplomePage.getPath() },
  ]

  const durationMatch = data.kpis.duration.match(/^(\d+)\s*ans?$/)
  const courseDuration = durationMatch ? `P${durationMatch[1]}Y` : undefined
  const offresItemList = buildOffresItemList(data.cards)

  return (
    <Box>
      <SchemaOrg
        type="WebPage"
        title={`${data.titre} en alternance`}
        description={`Découvrez le ${data.titre} en alternance : programme, prérequis, salaire, entreprises qui recrutent et débouchés.`}
        url={diplomePage.getPath()}
        breadcrumbs={breadcrumbs}
      />
      <SchemaOrg
        type="Course"
        title={`${data.titre} en alternance`}
        description={`Découvrez le ${data.titre} en alternance : programme, prérequis, salaire, entreprises qui recrutent et débouchés.`}
        url={diplomePage.getPath()}
        breadcrumbs={breadcrumbs}
        courseCredential={data.intituleLongFormation}
        courseDuration={courseDuration}
        omitBreadcrumb
      />
      {offresItemList.length > 0 && (
        <SchemaOrg
          type="ItemList"
          title={`Offres en alternance pour le ${data.titre}`}
          description={`Sélection d'offres d'alternance et d'entreprises qui recrutent pour le ${data.titre}.`}
          url={diplomePage.getPath()}
          breadcrumbs={breadcrumbs}
          itemList={offresItemList}
          omitBreadcrumb
        />
      )}
      <Breadcrumb pages={[PAGES.static.alternanceDiplomes, diplomePage]} />

      <DefaultContainer sx={{ px: 0 }}>
        <HeroDiplome titre={data.titre} sousTitre={data.sousTitre} kpis={data.kpis} romes={data.romes} />

        <Box sx={{ py: fr.spacing("8v") }}>
          <DescriptionDiplome titre={data.titre} text={data.description.text} objectifs={data.description.objectifs} />
        </Box>

        <Box sx={{ py: fr.spacing("8v") }}>
          <ProgrammeDiplome titre={data.titre} text={data.programme.text} sections={data.programme.sections} />
        </Box>

        <PreparationSection titre={data.titre} />

        <Box sx={{ py: fr.spacing("8v") }}>
          <EcolesSection titre={data.titre} formations={data?.ecoles ?? []} romes={data.romes} />
        </Box>

        <SalaireSection
          titre={
            <>
              Le salaire en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{data.titre}</span> en alternance
            </>
          }
          utmParams={UTM_PARAMS}
        />

        <Box sx={{ py: fr.spacing("8v") }}>
          <MetiersSection titre={data.titre} text={data.metiers.text} liste={data?.metiers?.liste ?? []} romes={data?.romes ?? []} />
        </Box>

        <Box sx={{ py: fr.spacing("8v") }}>
          <OffresSection offreCount={data.kpis.offres} romes={data?.romes ?? []} offres={data?.cards ?? []} />
        </Box>

        <ExplorerDiplomesSection currentSlug={slug} />
      </DefaultContainer>
    </Box>
  )
}
