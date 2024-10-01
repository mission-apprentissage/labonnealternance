import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { FormulaireCreationOffre, Bandeau } from "../../../components/espace_pro"

export default function DepotRapideAjouterVoeux() {
  const router = useRouter()
  const { displayBanner } = router.query

  return (
    <DepotSimplifieLayout>
      {displayBanner === "true" && (
        <Bandeau
          type="success"
          header="Votre compte a été créé avec succès, et est en attente de vérification."
          description="Vous pouvez d’ores et déjà créer une offre de recrutement."
        />
      )}
      <Box mt={10}>
        <FormulaireCreationOffre />
      </Box>
    </DepotSimplifieLayout>
  )
}
