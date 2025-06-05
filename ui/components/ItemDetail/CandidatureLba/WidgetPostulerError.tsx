import { Box } from "@chakra-ui/react"
import React from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

const getErrorText = (error: string) => {
  switch (error) {
    case "Société non trouvée":
    case "not_found":
    case "item_not_found": {
      return "L'offre n'est plus disponible"
    }
    case BusinessErrorCodes.INTERNAL_EMAIL: {
      return "Les informations de contact disponibles ne permettent pas de postuler auprès de cette société."
    }
    case "missing_caller_parameter": {
      return "La source de l'appel au service est manquante (caller)."
    }
    case "missing_item_id_parameter": {
      return "L'identifiant l'offre est manquant (itemId)."
    }
    case "missing_type_parameter": {
      return "Le type d'offre est manquant (type)."
    }
    case "unexpected_type": {
      return "Le type d'offre n'est pas reconnu."
    }
    default: {
      return "Nous rencontrons un problème technique. Veuillez nous excuser pour le dérangement."
    }
  }
}

export function WidgetPostulerError({ error }) {
  const errorText = getErrorText(error)
  return (
    <Box width="250px" textAlign="center" m="auto" my={8}>
      {errorText}
    </Box>
  )
}
