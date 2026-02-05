import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantApprentissageEtHandicap.getMetadata()

const ApprentissageEtHandicapPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantApprentissageEtHandicap]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["apprentissage-et-handicap"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["apprentissage-et-handicap"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default ApprentissageEtHandicapPage
