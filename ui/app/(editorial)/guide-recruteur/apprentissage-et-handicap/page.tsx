import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

const ApprentissageEtHandicapPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurApprentissageEtHandicap]

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
