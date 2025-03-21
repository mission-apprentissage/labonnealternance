import { Box, Container } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { NextSeo } from "next-seo"
import { useState } from "react"

import { AlgoRecruiter } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruiter"
import { getApplicationCompanyEmailAddress } from "@/utils/api"

import Breadcrumb from "../components/breadcrumb"
import FormulaireDesinscription from "../components/DesinscriptionEntreprise/FormulaireDesinscription"
import SuccesDesinscription from "../components/DesinscriptionEntreprise/SuccesDesinscription"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

const DesinscriptionRecruteur = () => {
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()
  const { application_id } = router.query as { application_id: string }

  const handleUnsubscribeSuccess = () => {
    setIsSuccess(true)
  }

  const { data } = useQuery(["getApplicationEmail"], () => getApplicationCompanyEmailAddress(application_id), {
    enabled: !!application_id,
  })

  return (
    <Box>
      <NextSeo
        title="Désinscription candidatures spontanées | La bonne alternance | Trouvez votre alternance"
        description="Désinscrivez vous de l'envoi de candidatures spontanées."
      />

      <ScrollToTop />
      <Navigation currentPage="desinscription" />
      <Box as="main">
        <Breadcrumb forPage="desinscription" label="Désinscription" />

        <Container my={0} px={0} variant="pageContainer" bg="white">
          {!isSuccess ? (
            <>
              <FormulaireDesinscription companyEmail={data?.company_email || ""} handleUnsubscribeSuccess={handleUnsubscribeSuccess} />

              <Box>
                <AlgoRecruiter withLinks={false} />
              </Box>
            </>
          ) : (
            <>
              <SuccesDesinscription />
            </>
          )}
        </Container>
        <Box mb={3}>&nbsp;</Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default DesinscriptionRecruteur
