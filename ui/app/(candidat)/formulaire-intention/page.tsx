"use client"

// import { NextSeo } from "next-seo"
import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"

import { IntentionForm } from "@/components/IntentionForm.tsx/IntentionForm"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function FormulaireIntentionPage() {
  const { token, id, company_recruitment_intention } = useSearchParamsRecord()

  return (
    <>
      {/* <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." /> */}
      <IntentionForm id={id} company_recruitment_intention={parseEnum(ApplicationIntention, company_recruitment_intention)} token={token} />
    </>
  )
}
