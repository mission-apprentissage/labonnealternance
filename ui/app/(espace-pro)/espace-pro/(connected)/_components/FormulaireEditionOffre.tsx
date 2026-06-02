"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { IJob } from "shared"
import { FormulaireEditionOffreStep1 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep1"
import { FormulaireEditionOffreStep2 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep2"
import { FormulaireEditionOffreStep3FtSupport } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep3FtSupport"
import { getFormulaire, getFormulaireByToken } from "@/utils/api"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const FT_ELIGIBLE_ZIP_PREFIXES = ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88", "44", "49", "53", "72", "85"]

const FRENCH_ZIP_CODE_REGEX = /\b(\d{5})\b/g

const extractZipCode = (formulaire?: { address_detail?: unknown; address?: string | null } | null): string | undefined => {
  const fromDetail = (formulaire?.address_detail as any)?.code_postal
  if (typeof fromDetail === "string" && fromDetail.length > 0) return fromDetail

  if (formulaire?.address) {
    const matches = [...formulaire.address.matchAll(FRENCH_ZIP_CODE_REGEX)]
    if (matches.length > 0) return matches[0][1]
  }

  return undefined
}

// dans la liste des cps autorisés, on exclut les offres du secteur interim (naf 78.20Z) et les offres publiées par les cfa (url contenant "/cfa/") qui ne sont pas éligibles au support ft
const isEligibleForFtSupport = (pathname: string, formulaire: { address_detail?: unknown; address?: string | null; naf_code?: string | null } | null): boolean => {
  const zipCode = extractZipCode(formulaire)
  if (!zipCode) return false

  return FT_ELIGIBLE_ZIP_PREFIXES.some((prefix) => zipCode.startsWith(prefix)) && formulaire?.naf_code !== "78.20Z" && !pathname.includes("/cfa/")
}

export const FormulaireEditionOffre = ({
  offre,
  establishment_id,
  handleSave,
  onChangeScreen,
}: {
  offre?: IJob
  establishment_id?: string
  handleSave: (values: any) => void
  onChangeScreen?: () => void
}) => {
  const { token } = useSearchParamsRecord() as { token?: string }
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [formValues, setFormValues] = useState<any>({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentStep])

  const pathname = usePathname()

  const { data: formulaire } = useQuery({
    queryKey: ["formulaire", establishment_id, token],
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id!)),
    enabled: Boolean(establishment_id),
  })

  if (!establishment_id) return <></>

  const isFtEligible = isEligibleForFtSupport(pathname, formulaire)
  const totalSteps = isFtEligible ? 3 : 2

  return (
    <>
      {currentStep === 1 ? (
        <FormulaireEditionOffreStep1
          formValues={formValues}
          onSubmit={(values) => {
            setFormValues({ ...formValues, ...values })
            setCurrentStep(2)
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_STARTED,
              step_name: "company_description",
              ft_eligible: isFtEligible,
            })
            onChangeScreen?.()
          }}
          offre={offre}
          establishment_id={establishment_id}
          totalSteps={totalSteps}
        />
      ) : currentStep === 2 ? (
        <FormulaireEditionOffreStep2
          onSubmit={(values) => {
            if (!isFtEligible) {
              const finalValues = { ...formValues, ...values, ft_support: false }
              pushMatomoEvent({
                event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
                step_name: "screening_questions",
                has_screening_questions: finalValues.to_applicant_questions?.length > 0,
                ft_eligible: isFtEligible,
              })
              handleSave(finalValues)
            } else {
              setFormValues({ ...formValues, ...values })
              setCurrentStep(3)
              onChangeScreen?.()
            }
          }}
          offre={offre}
          onCancel={() => {
            setCurrentStep(1)
            onChangeScreen?.()
          }}
          isFtEligible={isFtEligible}
          totalSteps={totalSteps}
        />
      ) : currentStep === 3 && isFtEligible ? (
        <FormulaireEditionOffreStep3FtSupport
          onSubmit={(values) => {
            const finalValues = { ...formValues, ...values }
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
              step_name: "ft_support",
              has_screening_questions: finalValues.to_applicant_questions?.length > 0,
              ft_eligible: isFtEligible,
            })
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_FT_PARTNERSHIP_STEP,
              ft_partnership: finalValues.ft_support,
            })
            handleSave(finalValues)
          }}
          offre={offre}
          onCancel={() => {
            setCurrentStep(2)
            onChangeScreen?.()
          }}
        />
      ) : null}
    </>
  )
}
