import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { ModalReadOnly } from "@/components/ModalReadOnly"

interface ConfirmationModificationOpcoProps {
  isOpen: boolean
  onClose: () => void
  setFieldValue: (field: string, value: any) => void
  previousValue: string
  newValue: string
  establishment_raison_sociale: string
}

export default function ConfirmationModificationOpco(props: ConfirmationModificationOpcoProps) {
  const { isOpen, onClose, setFieldValue, previousValue, newValue, establishment_raison_sociale } = props

  const handleUpdate = () => {
    setFieldValue("opco", newValue)
    onClose()
  }

  const handleClose = () => {
    setFieldValue("opco", previousValue)
    onClose()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("1w") }} component="h2">
          Changement d’OPCO pour l’entreprise {establishment_raison_sociale}
        </Typography>

        <Box sx={{ pb: fr.spacing("1w") }}>
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
            Vous vous apprêtez à modifier l’OPCO de rattachement de cette entreprise, cela signifie que cette entreprise n’apparaîtra plus dans votre console de gestion.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), pt: fr.spacing("2w") }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Ancien OPCO :</Typography>
              <Typography sx={{ backgroundColor: "#F9F8F6", px: fr.spacing("1w"), py: fr.spacing("1v"), mr: fr.spacing("1w"), fontWeight: 700 }}>{previousValue}</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Nouvel OPCO :</Typography>
              <Typography sx={{ backgroundColor: "#F9F8F6", px: fr.spacing("1w"), py: fr.spacing("1v"), fontWeight: 700 }}>{newValue}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700 }}>Êtes-vous sûr de vouloir poursuivre ?</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box sx={{ mr: fr.spacing("3v") }}>
            <Button priority="secondary" onClick={() => handleClose()}>
              Annuler
            </Button>
          </Box>
          <Button onClick={() => handleUpdate()}>Confirmer</Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
