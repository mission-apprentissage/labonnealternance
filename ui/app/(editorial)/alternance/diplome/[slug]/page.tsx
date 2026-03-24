import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"
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
import { mockDiplomeData } from "./_data/mock"

// TODO: Remplacer par un appel API ou des données statiques
// TODO: Ajouter la route dans PAGES (routes.utils.ts) quand la page sera finalisée
function getDiplomeData(_slug: string) {
  return mockDiplomeData
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = getDiplomeData(slug)

  return {
    title: `${data.titre} | La bonne alternance`,
    description: `Découvrez le ${data.titre} : programme, prérequis, salaire, entreprises qui recrutent et perspectives d'emploi. Trouvez votre alternance sur La bonne alternance.`,
  }
}

export default async function DiplomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = getDiplomeData(slug)

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.home]} />

      <DefaultContainer>
        <HeroDiplome titre={data.titre} titreAccent={data.titreAccent} sousTitre={data.sousTitre} kpis={data.kpis} />
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <DescriptionDiplome title={data.description.title} titleHighlight={data.description.titleHighlight} text={data.description.text} objectifs={data.description.objectifs} />
        </Box>
      </DefaultContainer>

      <DefaultContainer>
        <Box sx={{ py: fr.spacing("8v") }}>
          <ProgrammeDiplome title={data.programme.title} titleHighlight={data.programme.titleHighlight} text={data.programme.text} sections={data.programme.sections} />
        </Box>
      </DefaultContainer>

      {/* Section pleine largeur avec fond bleu */}
      <PreparationSection title={data.preparation.title} titleHighlight={data.preparation.titleHighlight} text={data.preparation.text} ressources={data.preparation.ressources} />

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
