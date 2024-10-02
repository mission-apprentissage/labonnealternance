import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { FormulaireCreationOffre, Bandeau } from "@/components/espace_pro"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseOffre = () => {
  const router = useRouter()
  const { displayBanner } = router.query

  return (
    <Box>
      <Bandeau
        type="success"
        header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
        description="Vous pouvez d’ores et déjà créer une offre de recrutement."
      />
      <Box mt={10}>
        <FormulaireCreationOffre />
      </Box>
      <WidgetFooter />
    </Box>
  )
}

export default WidgetEntrepriseOffre
