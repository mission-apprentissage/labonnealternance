import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

const PreventionDesRisquesProfessionnelsPourLesApprentisPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurPreventionDesRisquesProfessionnelsPourLesApprentis]
  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["prevention-des-risques-professionnels-pour-les-apprentis"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default PreventionDesRisquesProfessionnelsPourLesApprentisPage
