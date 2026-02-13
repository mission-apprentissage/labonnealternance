import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideRecruteurJeSuisEmployeurPublic.getMetadata()

const JeSuisEmployeurPublicPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurJeSuisEmployeurPublic]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["je-suis-employeur-public"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["je-suis-employeur-public"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default JeSuisEmployeurPublicPage
