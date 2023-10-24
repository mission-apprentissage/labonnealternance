import { Box } from "@chakra-ui/react"

import { useSingleValueQueryParams } from "@/common/hooks/useSingleValueQueryParams"
import AjouterVoeux from "@/components/espace_pro/AjouterVoeux"

import { AuthentificationLayout, Bandeau } from "../../../components/espace_pro"

export default function DepotRapideAjouterVoeux(props) {
  console.log("DepotRapideAjouterVoeux", props)
  const { displayBanner } = useSingleValueQueryParams()

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
