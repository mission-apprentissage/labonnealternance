"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { IJob } from "shared"
import { FormulaireEditionOffreStep1 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep1"
import { FormulaireEditionOffreStep2 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep2"
import { FormulaireEditionOffreStep3 } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep3CFA"
import { FormulaireEditionOffreStep4FtSupport } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffreStep4FtSupport"
import { getFormulaire, getFormulaireByToken } from "@/utils/api"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [formValues, setFormValues] = useState<any>({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentStep])

  // certaines routes réutilisent le même composant entre deux offres (ou entre édition et création) sans le remonter :
  // on réinitialise explicitement l'étape courante et les valeurs saisies dès que l'offre éditée change (y compris vers "aucune offre" pour une création)
  useEffect(() => {
    setCurrentStep(1)
    setFormValues({})
  }, [offre?._id])

  const pathname = usePathname()

  const { data: formulaire } = useQuery({
    queryKey: ["formulaire", establishment_id, token],
    queryFn: () => (token ? getFormulaireByToken(establishment_id, token) : getFormulaire(establishment_id!)),
    enabled: Boolean(establishment_id),
  })

  if (!establishment_id) return <></>

  const isFtEligible = isEligibleForFtSupport(pathname, formulaire)

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
          token={token}
        />
      ) : currentStep === 2 ? (
        <FormulaireEditionOffreStep2
          onSubmit={({ etablissements, ...values }) => {
            const hasCfa = Boolean(etablissements?.length)
            if (hasCfa) {
              // des CFA à proximité sont disponibles : l'étape 3 permet de choisir lesquels contacter
              setFormValues({ ...formValues, ...values, etablissements })
              setCurrentStep(3)
              onChangeScreen?.()
            } else if (isFtEligible) {
              // pas de CFA à proximité mais éligible à l'accompagnement France Travail : l'étape 3 est sautée
              setFormValues({ ...formValues, ...values, etablissements, cfaCountProposed: 0, cfaCountSelected: 0 })
              setCurrentStep(4)
              onChangeScreen?.()
            } else {
              // ni CFA à proximité, ni éligibilité France Travail : l'offre est créée directement
              const finalValues = { ...formValues, ...values, ft_support: false }
              pushMatomoEvent({
                event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
                step_name: "cfa_share",
                has_screening_questions: finalValues.to_applicant_questions?.length > 0,
                ft_eligible: isFtEligible,
                description_mode: finalValues.job_description ? "custom" : "structured",
              })
              pushMatomoEvent({
                event: MATOMO_EVENTS.CFA_SHARE_CONFIRMED,
                cfa_count_proposed: 0,
                cfa_count_selected: 0,
              })
              handleSave(finalValues)
            }
          }}
          offre={offre}
          romeCode={formValues?.rome_code?.[0] ?? offre?.rome_code?.[0]}
          geoCoordinates={formulaire?.geo_coordinates}
          isFtEligible={isFtEligible}
          onCancel={() => {
            setCurrentStep(1)
            onChangeScreen?.()
          }}
        />
      ) : currentStep === 3 ? (
        <FormulaireEditionOffreStep3
          onSubmit={(values) => {
            if (!isFtEligible) {
              const { cfaCountProposed, cfaCountSelected, etablissements, ...finalValues } = { ...formValues, ...values, ft_support: false }
              pushMatomoEvent({
                event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
                step_name: "cfa_share",
                has_screening_questions: finalValues.to_applicant_questions?.length > 0,
                ft_eligible: isFtEligible,
              })
              pushMatomoEvent({
                event: MATOMO_EVENTS.CFA_SHARE_CONFIRMED,
                cfa_count_proposed: cfaCountProposed,
                cfa_count_selected: cfaCountSelected,
              })
              handleSave(finalValues)
            } else {
              setFormValues({ ...formValues, ...values })
              setCurrentStep(4)
              onChangeScreen?.()
            }
          }}
          offre={offre}
          etablissements={formValues?.etablissements ?? []}
          onCancel={() => {
            setCurrentStep(2)
            onChangeScreen?.()
          }}
          isFtEligible={isFtEligible}
        />
      ) : currentStep === 4 && isFtEligible ? (
        <FormulaireEditionOffreStep4FtSupport
          onSubmit={(values) => {
            const { cfaCountProposed, cfaCountSelected, etablissements, ...finalValues } = { ...formValues, ...values }
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_COMPLETED,
              step_name: "ft_support",
              has_screening_questions: finalValues.to_applicant_questions?.length > 0,
              ft_eligible: isFtEligible,
              description_mode: finalValues.job_description ? "custom" : "structured",
            })
            pushMatomoEvent({
              event: MATOMO_EVENTS.JOB_CREATION_FT_PARTNERSHIP_STEP,
              ft_partnership: finalValues.ft_support,
            })
            pushMatomoEvent({
              event: MATOMO_EVENTS.CFA_SHARE_CONFIRMED,
              cfa_count_proposed: cfaCountProposed,
              cfa_count_selected: cfaCountSelected,
            })
            handleSave(finalValues)
          }}
          offre={offre}
          onCancel={() => {
            setCurrentStep(3)
            onChangeScreen?.()
          }}
        />
      ) : null}
    </>
  )
}
