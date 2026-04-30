import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ISeoDiplome } from "shared/models/seoDiplome.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { diplomeData } from "@/app/(editorial)/alternance/_components/diplome_data"
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

function getDiplomeData(slug: string) {
  return apiGet("/_private/seo/diplome/:diplome", { params: { diplome: slug } })
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

export default async function DiplomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rawData = await getDiplomeData(slug)

  if (!rawData) notFound()

  const data = rawData as unknown as ISeoDiplome

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.home]} />

      <DefaultContainer>
        <HeroDiplome titre={data.titre} sousTitre={data.sousTitre} kpis={data.kpis} romes={data.romes} />
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <DescriptionDiplome titre={data.titre} text={data.description.text} objectifs={data.description.objectifs} />
        </Box>
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <ProgrammeDiplome titre={data.titre} text={data.programme.text} sections={data.programme.sections} />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu */}
      <PreparationSection titre={data.titre} />

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <EcolesSection titre={data.titre} formations={data?.ecoles ?? []} romes={data.romes} />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu clair */}
      <SalaireSection titre={data.titre} lignes={data?.salaire ?? []} />

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <MetiersSection titre={data.titre} text={data.metiers.text} liste={data?.metiers?.liste ?? []} romes={data?.romes ?? []} />
        </Box>
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <OffresSection offreCount={data.kpis.offres} offres={data?.cards ?? []} />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu */}
      <ExplorerDiplomesSection currentSlug={slug} />
    </Box>
  )
}
