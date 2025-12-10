import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

import { ModalReadOnly } from "@/components/ModalReadOnly"
import { apiGet } from "@/utils/api.utils"

export default function ModificationCompteEmail(props) {
  const { isOpen, onClose } = props
  const router = useRouter()

  const handleLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push("/espace-pro/authentification")
  }

  return (
    <ModalReadOnly size="xl" isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: 2 }} component="h2">
          Changement d'email détecté
        </Typography>
        <Box
          sx={{
            pb: fr.spacing("1w"),
          }}
        >
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
            Vous venez de modifier votre email. Vous allez être redirigé vers la page d'authentification.
          </Typography>
          <Typography
            sx={{
              pt: fr.spacing("5v"),
            }}
          >
            Merci de vous connecter avec votre nouvel email.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box
            sx={{
              ml: fr.spacing("3v"),
            }}
          >
            <Button priority="primary" onClick={handleLogout}>
              Confirmer
            </Button>
          </Box>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
