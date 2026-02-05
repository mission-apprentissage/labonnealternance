import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-cfa/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideCFALaCarteEtudiantDesMetiers.getMetadata()

const LaCarteEtudiantDesMetiersPage = () => {
  const pages = [PAGES.static.guideCFA, PAGES.static.guideCFALaCarteEtudiantDesMetiers]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["la-carte-etudiant-des-metiers"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["la-carte-etudiant-des-metiers"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default LaCarteEtudiantDesMetiersPage
