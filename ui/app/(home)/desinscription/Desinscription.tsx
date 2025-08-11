"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { FormulaireDesinscription } from "@/app/(home)/desinscription/_components/FormulaireDesinscription"
import SuccesDesinscription from "@/app/(home)/desinscription/_components/SuccesDesinscription"
import { AlgoRecruteur } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruter"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { getApplicationCompanyEmailAddress } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export function DesinscriptionRecruteur() {
  const [isSuccess, setIsSuccess] = useState(false)

  const application_id = useSearchParams().get("application_id")

  const handleUnsubscribeSuccess = () => {
    setIsSuccess(true)
  }

  const { data } = useQuery({
    queryKey: ["getApplicationEmail", application_id],
    queryFn: () => getApplicationCompanyEmailAddress(application_id),
    enabled: Boolean(application_id),
  })

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.desinscription]} />
      <DefaultContainer sx={{ marginBottom: fr.spacing("5w") }}>
        {!isSuccess ? (
          <>
            <FormulaireDesinscription companyEmail={data?.company_email || ""} handleUnsubscribeSuccess={handleUnsubscribeSuccess} />
            <Box>
              <AlgoRecruteur withLinks={false} />
            </Box>
          </>
        ) : (
          <SuccesDesinscription />
        )}
      </DefaultContainer>
    </Box>
  )
}
