import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { parseEnum } from "shared"

import { SatisfactionForm } from "@/components/SatisfactionForm/SatisfactionForm"

import { ApplicantIntention } from "../../shared/constants/application"

const FormulaireIntention = () => {
  const router = useRouter()
  const { company_recruitment_intention, id, fn, ln, token } = router.query as {
    company_recruitment_intention: string
    id: string
    fn: string
    ln: string
    token: string | undefined
  }

  return (
    <>
      <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." />
      {router.isReady && (
        <SatisfactionForm id={id} firstName={fn} lastName={ln} token={token} company_recruitment_intention={parseEnum(ApplicantIntention, company_recruitment_intention)} />
      )}
    </>
  )
}

export default FormulaireIntention
