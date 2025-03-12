"use client"

import { Box } from "@chakra-ui/react"

import { Bandeau } from "@/components/espace_pro/Bandeau"
import { FormulaireCreationOffre } from "@/components/espace_pro/FormulaireCreationOffre/FormulaireCreationOffre"
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
        <FormulaireCreationOffre />
      </Box>
    </>
  )
}

export default WidgetEntrepriseOffre
