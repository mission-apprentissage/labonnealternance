import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { archiveFormulaire } from "@/utils/api"
import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"


interface ConfirmationSuppressionEntrepriseProps {
  isOpen: boolean
  onClose: () => void
  establishment_raison_sociale?: string
  establishment_id: string
}

export function ConfirmationSuppressionEntreprise(props: ConfirmationSuppressionEntrepriseProps) {
  const { isOpen, onClose, establishment_raison_sociale, establishment_id } = props
  const toast = useToast()

  const SupprimerFormulaire = () => {
    archiveFormulaire(establishment_id)
      .then(() => {
        toast({
          title: "Suppression réussie",
          description: "L'entreprise et ses offres ont bien été supprimée.",
          autoHideDuration: 4000,
        })
      })
      .finally(() => {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      })
    onClose()
  }

  return (
    <ModalReadOnly size="xl" isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("2w"), px: fr.spacing("2w") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("1w") }} component="h2">
          Supprimer {establishment_raison_sociale ?? ""}
        </Typography>

        <Box pb={2}>
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>
            En supprimant cette entreprise, l’ensemble des offres créées pour celle-ci ne seront plus visibles.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box mr={fr.spacing("3v")}>
            <Button priority="secondary" onClick={() => onClose()}>
              Annuler
            </Button>
          </Box>
          <Button onClick={() => SupprimerFormulaire()}>Supprimer</Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
