"use client"

// import { NextSeo } from "next-seo"
import { useSearchParams } from "next/navigation"
import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"

import { IntentionForm } from "@/components/IntentionForm.tsx/IntentionForm"

export default function FormulaireIntentionPage() {
  const params = useSearchParams()
  const token = params.get("token")
  const id = params.get("id")
  const company_recruitment_intention = params.get("company_recruitment_intention")

  return (
    <>
      {/* <NextSeo title="Formulaire d'intention | La bonne alternance | Trouvez votre alternance" description="Formulaire d'intention." /> */}
      <IntentionForm id={id} company_recruitment_intention={parseEnum(ApplicationIntention, company_recruitment_intention)} token={token} />
    </>
  )
}
