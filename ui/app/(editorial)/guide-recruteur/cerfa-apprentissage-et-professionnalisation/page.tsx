import type { Metadata } from "next"
import { LayoutArticle } from "@/app/(editorial)/_components/LayoutArticle"
import { Paragraph } from "@/app/(editorial)/_components/Paragraph"
import { RedirectionInterne } from "@/app/(editorial)/_components/RedirectionInterne"
import { UpdatedAtSection } from "@/app/(editorial)/_components/UpdatedAtSection"
import { ARTICLES } from "@/app/(editorial)/guide-recruteur/const"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getMetadata()

const JeSuisEmployeurPublicPage = () => {
  const pages = [PAGES.static.guideRecruteur, PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation]

  return (
    <LayoutArticle
      pages={pages}
      title={ARTICLES["cerfa-apprentissage-et-professionnalisation"].title}
      updatedAt={<UpdatedAtSection date={ARTICLES["cerfa-apprentissage-et-professionnalisation"].updatedAt} />}
      description={<></>}
      redirectionInterne={<RedirectionInterne source="guide-recruteur" />}
      allerPlusLoinItems={[]}
      sourceAllerPlusLoin="guide-recruteur"
      parentPage={PAGES.static.guideRecruteur}
      page={PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation}
    >
      <Paragraph component={"h2"} variant="h3">
        Contenu en cours de rédaction...
      </Paragraph>
    </LayoutArticle>
  )
}

export default JeSuisEmployeurPublicPage
