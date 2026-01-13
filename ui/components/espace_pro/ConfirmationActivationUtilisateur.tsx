import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"
import { ModalReadOnly } from "@/components/ModalReadOnly"

const ConfirmationActivationUtilisateur = (props: { isOpen: boolean; onClose: () => void; onConfirmation?: () => void; establishment_raison_sociale: string; _id: string }) => {
  const { isOpen, onClose, establishment_raison_sociale, _id } = props
  const { activate } = useUserPermissionsActions(_id)

  const activateUser = async () => {
    await activate()
    onClose()
    props.onConfirmation?.()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("1w") }} component="h2">
          Activation du compte
        </Typography>

        <Box sx={{ pb: fr.spacing("1w") }}>
          <Typography sx={{ mb: fr.spacing("2v"), color: "#3A3A3A", lineHeight: "24px" }}>
            Vous êtes sur le point d’activer le compte de l’entreprise {establishment_raison_sociale}. Une fois le compte validé, l’entreprise pourra accéder au service de dépot
            d’offres et modifier ses informations.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box mr={fr.spacing("3v")}>
            <Button priority="secondary" onClick={() => onClose()}>
              Annuler
            </Button>
          </Box>
          <Button onClick={async () => activateUser()}>Activer le compte</Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export default ConfirmationActivationUtilisateur
