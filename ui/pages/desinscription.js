import { Box, Container } from "@chakra-ui/react"
import { NextSeo } from "next-seo"
import React, { useState } from "react"

import Breadcrumb from "../components/breadcrumb"
import FormulaireDesinscription from "../components/DesinscriptionEntreprise/FormulaireDesinscription"
import SuccesDesinscription from "../components/DesinscriptionEntreprise/SuccesDesinscription"
import Footer from "../components/footer"
import AlgoRecruiter from "../components/HomeComponents/AlgoRecruiter"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

const DesinscriptionRecruteur = () => {
  const [isSuccess, setIsSuccess] = useState(false)

  const handleUnsubscribeSuccess = () => {
    setIsSuccess(true)
  }

  return (
    <Box>
      <NextSeo
        title="Désinscription candidatures spontanées | La bonne alternance | Trouvez votre alternance"
        description="Désinscrivez vous de l'envoi de candidatures spontanées."
      />

      <ScrollToTop />
      <Navigation currentPage="desinscription" />
      <Breadcrumb forPage="desinscription" label="Désinscription" />

      <Container my={0} px={0} variant="pageContainer" bg="white">
        {!isSuccess ? (
          <>
            <FormulaireDesinscription handleUnsubscribeSuccess={handleUnsubscribeSuccess} />

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
      <Footer />
    </Box>
  )
}

export default DesinscriptionRecruteur
