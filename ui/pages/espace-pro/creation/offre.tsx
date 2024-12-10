import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { FormulaireCreationOffre, Bandeau } from "../../../components/espace_pro"

export default function DepotRapideAjouterVoeux() {
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
    </DepotSimplifieLayout>
  )
}
