"use client"
import { Box, Container } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import FormulaireDesinscription from "@/app/(home)/desinscription/_components/FormulaireDesinscription"
import SuccesDesinscription from "@/app/(home)/desinscription/_components/SuccesDesinscription"
import { AlgoRecruteur } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruter"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { getApplicationCompanyEmailAddress } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function DesinscriptionRecruteur() {
  const [isSuccess, setIsSuccess] = useState(false)

  const application_id = useSearchParams().get("application_id")

  const handleUnsubscribeSuccess = () => {
    setIsSuccess(true)
  }

  const { data } = useQuery({
    queryKey: ["getApplicationEmail"],
    queryFn: () => getApplicationCompanyEmailAddress(application_id),
    enabled: !!application_id,
  })

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.desinscription]} />

      <Container p={{ base: 2, md: 0 }} my={0} mb={[0, 12]} variant="whitePageContainer">
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
      </Container>
    </Box>
  )
}
