import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

const ComprendreLaRemunerationPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantComprendreLaRemuneration]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["comprendre-la-remuneration"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["comprendre-la-remuneration"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default ComprendreLaRemunerationPage
