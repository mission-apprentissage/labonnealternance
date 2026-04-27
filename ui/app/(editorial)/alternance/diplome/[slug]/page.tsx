import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
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
import { diplomesData } from "./_data/diplomes"

function getDiplomeData(slug: string) {
  return diplomesData.find((d) => d.slug === slug) ?? null
}

export function generateStaticParams() {
  return diplomesData.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = getDiplomeData(slug)
  if (!data) return {}

  return {
    title: `${data.titre} | La bonne alternance`,
    description: `Découvrez le ${data.titre} : programme, prérequis, salaire, entreprises qui recrutent et perspectives d'emploi. Trouvez votre alternance sur La bonne alternance.`,
  }
}

export default async function DiplomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = getDiplomeData(slug)
  if (!data) notFound()

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.home]} />

      <DefaultContainer>
        <HeroDiplome titre={data.titre} sousTitre={data.sousTitre} kpis={data.kpis} />
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
          <EcolesSection title={data.ecoles.title} titleHighlight={data.ecoles.titleHighlight} formations={data.ecoles.formations} />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu clair */}
      <SalaireSection
        title={data.salaire.title}
        titleHighlight={data.salaire.titleHighlight}
        titleSuffix={data.salaire.titleSuffix}
        texteIntro={data.salaire.texteIntro}
        lignes={data.salaire.lignes}
      />

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <MetiersSection title={data.metiers.title} text={data.metiers.text} liste={data.metiers.liste} />
        </Box>
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <OffresSection />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu */}
      <ExplorerDiplomesSection autresDiplomes={data.autresDiplomes} />
    </Box>
  )
}
