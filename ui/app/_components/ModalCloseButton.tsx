import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

export default function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignSelf: "flex-end",
      }}
    >
      <Button type="button" priority="tertiary no outline" onClick={onClose} iconId="fr-icon-close-line" iconPosition="right">
        Fermer
      </Button>
    </Box>
  )
}
