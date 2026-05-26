"use client"

import { useState } from "react"
import type { IJob } from "shared"
import { FormulaireEditionOffreStep1 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep1"
import { FormulaireEditionOffreStep2 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep2"
import { FormulaireEditionOffreStep3FtSupport } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep3FtSupport"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

export const FormulaireEditionOffre = ({
  offre,
  establishment_id,
  handleSave,
  onChangeScreen,
}: {
  offre?: IJob
  establishment_id?: string
  handleSave?: (values: any) => void
  onChangeScreen?: () => void
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [formValues, setFormValues] = useState<any>({})

  if (!establishment_id) return <></>

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
              ft_eligible: false,
            })
            onChangeScreen?.()
          }}
          offre={offre}
          establishment_id={establishment_id}
        />
      ) : currentStep === 2 ? (
        <FormulaireEditionOffreStep2
          onSubmit={(values) => {
            setFormValues({ ...formValues, ...values })
            setCurrentStep(3)
            onChangeScreen?.()
          }}
          offre={offre}
          onCancel={() => {
            setCurrentStep(1)
            onChangeScreen?.()
          }}
        />
      ) : currentStep === 3 ? (
        <FormulaireEditionOffreStep3FtSupport
          onSubmit={(values) => {
            const finalValues = { ...formValues, ...values }
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
              step_name: "ft_support",
              has_screening_questions: finalValues.to_applicant_questions?.length > 0,
              ft_eligible: finalValues.ft_support,
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
