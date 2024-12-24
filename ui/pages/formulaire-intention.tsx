import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { parseEnum } from "shared"
import { ApplicantIntention } from "shared/constants/application"

import { IntentionForm } from "@/components/IntentionForm.tsx/IntentionForm"
import { SatisfactionForm } from "@/components/SatisfactionForm/SatisfactionForm"

const FormulaireIntention = () => {
  const router = useRouter()
  const { company_recruitment_intention, id, fn, ln, token } = router.query as {
    company_recruitment_intention: ApplicantIntention
    id: string
    fn: string | undefined
    ln: string | undefined
    token: string | undefined
  }

  return (
    <>
      <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." />
      {router.isReady &&
        (ln ? (
          <SatisfactionForm id={id} firstName={fn!} lastName={ln!} token={token} company_recruitment_intention={parseEnum(ApplicantIntention, company_recruitment_intention)} />
        ) : (
          <IntentionForm id={id} company_recruitment_intention={parseEnum(ApplicantIntention, company_recruitment_intention)} token={token} />
        ))}
    </>
  )
}

export default FormulaireIntention
