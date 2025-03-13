"use client"

import { Box } from "@chakra-ui/react"

import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/FormulaireEditionOffre"
import { Bandeau } from "@/components/espace_pro/Bandeau"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export const WidgetEntrepriseOffre = () => {
  const { displayBanner } = useSearchParamsRecord()
  return (
    <>
      <Bandeau
        type="success"
        header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
        description="Déposez votre offre dès maintenant."
      />
      <Box mt={10}>
        <FormulaireEditionOffre />
      </Box>
    </>
  )
}

export default WidgetEntrepriseOffre
