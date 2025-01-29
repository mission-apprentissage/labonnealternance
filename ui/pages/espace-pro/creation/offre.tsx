import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { Bandeau } from "@/components/espace_pro/Bandeau"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { FormulaireCreationOffre } from "../../../components/espace_pro"

export default function DepotRapideAjouterVoeux() {
  const router = useRouter()
  const { displayBanner } = router.query

  return (
    <DepotSimplifieLayout>
      <Box p={4}>
        <Bandeau
          type="success"
          header={`Votre compte a été créé avec succès${displayBanner === "true" ? " et est en attente de vérification" : ""}.`}
          description="Déposez votre offre dès maintenant."
        />
        <FormulaireCreationOffre />
      </Box>
    </DepotSimplifieLayout>
  )
}
