import { Box } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

export const DemandeDeContactButton = ({ isCollapsedHeader, onClick }: { isCollapsedHeader?: boolean; onClick: () => void }) => {
  return (
    <Box data-testid="DemandeDeContact">
      <Box my={isCollapsedHeader ? 2 : 4}>
        <Button data-testid="prdvButton" onClick={onClick} aria-label="Ouvrir le formulaire de demande de contact">
          Je prends rendez-vous
        </Button>
      </Box>
    </Box>
  )
}
