import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"

import { IntentionForm } from "@/components/IntentionForm.tsx/IntentionForm"

const FormulaireIntention = () => {
  const router = useRouter()
  const { company_recruitment_intention, id, token } = router.query as {
    company_recruitment_intention: ApplicationIntention
    id: string
    token: string | undefined
  }

  return (
    <>
      <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." />
      {router.isReady && <IntentionForm id={id} company_recruitment_intention={parseEnum(ApplicationIntention, company_recruitment_intention)} token={token} />}
    </>
  )
}

export default FormulaireIntention
