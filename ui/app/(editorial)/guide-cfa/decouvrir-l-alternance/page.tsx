import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideCFADecouvrirLAlternance.getMetadata()

const DecouvrirLAlternancePage = () => {
  const pages = [PAGES.static.guideCFA, PAGES.static.guideCFADecouvrirLAlternance]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["decouvrir-l-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["decouvrir-l-alternance"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default DecouvrirLAlternancePage
