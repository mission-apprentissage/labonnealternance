import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { AjouterVoeux, AuthentificationLayout, Bandeau } from "../../../components/espace_pro"

export default function DepotRapideAjouterVoeux(props) {
  // const location = useLocation()
  // const { displayBanner } = location.state
  const router = useRouter()
  const { displayBanner } = router.query
  // TODO_AB

  return (
    <AuthentificationLayout>
      {displayBanner && (
        <Bandeau
          type="success"
          header="Votre compte a été créé avec succès, et est en attente de vérification."
          description="Vous pouvez d’ores et déjà créer une offre de recrutement."
        />
      )}
      <Box mt={10}>
        <AjouterVoeux {...props} />
      </Box>
    </AuthentificationLayout>
  )
}
