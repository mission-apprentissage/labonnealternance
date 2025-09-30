"use client"

import { parseEnum } from "shared"
import { ApplicationIntention } from "shared/constants/application"

import { IntentionForm } from "@/components/IntentionForm.tsx/IntentionForm"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function FormulaireIntentionPage() {
  const { token, id, company_recruitment_intention } = useSearchParamsRecord()

  return (
    <>
      <IntentionForm id={id} company_recruitment_intention={parseEnum(ApplicationIntention, company_recruitment_intention)} token={token} />
    </>
  )
}
