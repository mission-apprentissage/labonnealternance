import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideRecruteurAidesALEmbaucheEnAlternance.getMetadata()

const AidesALEmbaucheEnAlternancePage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurAidesALEmbaucheEnAlternance]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["aides-a-l-embauche-en-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["aides-a-l-embauche-en-alternance"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default AidesALEmbaucheEnAlternancePage
