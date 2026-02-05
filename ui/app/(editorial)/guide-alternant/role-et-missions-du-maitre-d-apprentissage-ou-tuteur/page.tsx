import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-alternant/const"
import { PAGES } from "@/utils/routes.utils"

const RoleEtMissionsDuMaitreDApprentissageOuTuteurPage = () => {
  const pages = [PAGES.static.guideAlternant, PAGES.static.guideAlternantRoleEtMissionsDuMaitreDApprentissageOuTuteur]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["role-et-missions-du-maitre-d-apprentissage-ou-tuteur"].updatedAt} />}
      description={<></>}
      allerPlusLoinItems={[]}
    >
      <Paragraph>Contenu en cours de rédaction.</Paragraph>
    </LayoutArticle>
  )
}

export default RoleEtMissionsDuMaitreDApprentissageOuTuteurPage
