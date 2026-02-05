import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

const JeSuisEmployeurPublicPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["cerfa-apprentissage-et-professionnalisation"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["cerfa-apprentissage-et-professionnalisation"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default JeSuisEmployeurPublicPage
