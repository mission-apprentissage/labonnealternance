import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { FormulaireCreationOffre } from "@/components/espace_pro"
import { Bandeau } from "@/components/espace_pro/Bandeau"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseOffre = () => {
  const router = useRouter()
  const { displayBanner } = router.query

  return (
    <DepotSimplifieLayout>
      <Bandeau
        type="success"
        header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
        description="Déposez votre offre dès maintenant."
      />
      <Box mt={10}>
        <FormulaireCreationOffre />
      </Box>
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseOffre
