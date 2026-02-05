import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideAlternantCommentSignerUnContratEnAlternance.getMetadata()

const CommentSignerUnContratEnAlternancePage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantCommentSignerUnContratEnAlternance]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["comment-signer-un-contrat-en-alternance"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["comment-signer-un-contrat-en-alternance"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default CommentSignerUnContratEnAlternancePage
