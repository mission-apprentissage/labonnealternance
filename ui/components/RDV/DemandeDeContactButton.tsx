import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

export const DemandeDeContactButton = ({ isCollapsedHeader, onClick }: { isCollapsedHeader?: boolean; onClick: () => void }) => {
  return (
    <Box data-testid="DemandeDeContact">
      <Box sx={{ my: isCollapsedHeader ? 1 : 2 }}>
        <Button data-testid="prdvButton" onClick={onClick} aria-label="Ouvrir le formulaire de demande de contact">
          Je prends rendez-vous
        </Button>
      </Box>
    </Box>
  )
}
