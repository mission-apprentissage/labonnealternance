import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantLaRuptureDeContrat.getMetadata()

const LaRuptureDeContratPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantLaRuptureDeContrat]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["la-rupture-de-contrat"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["la-rupture-de-contrat"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default LaRuptureDeContratPage
