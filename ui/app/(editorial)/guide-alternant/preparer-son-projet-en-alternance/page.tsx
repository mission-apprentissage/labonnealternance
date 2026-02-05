import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

const PreparerSonProjetEnAlternancePage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantPreparerSonProjetEnAlternance]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["preparer-son-projet-en-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["preparer-son-projet-en-alternance"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default PreparerSonProjetEnAlternancePage
