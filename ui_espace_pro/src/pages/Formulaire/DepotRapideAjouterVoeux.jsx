import { Box } from "@chakra-ui/react"
import { useLocation } from "react-router-dom"
import { AjouterVoeux, AuthentificationLayout, Bandeau } from "../../components"

export const DepotRapideAjouterVoeux = (props) => {
  const location = useLocation()
  const { displayBanner } = location.state

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

export default DepotRapideAjouterVoeux
