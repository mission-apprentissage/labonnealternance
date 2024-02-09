import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { AjouterVoeux, Bandeau } from "@/components/espace_pro"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseOffre = () => {
  const router = useRouter()
  const { displayBanner } = router.query

  return (
    <Box>
      {displayBanner && (
        <Bandeau
          type="success"
          header="Votre compte a été créé avec succès, et est en attente de vérification."
          description="Vous pouvez d’ores et déjà créer une offre de recrutement."
        />
      )}
      <Box mt={10}>
        <AjouterVoeux />
      </Box>
      <WidgetFooter />
    </Box>
  )
}

export default WidgetEntrepriseOffre
