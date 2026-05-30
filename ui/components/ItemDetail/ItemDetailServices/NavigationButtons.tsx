import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

export const NavigationButtons = ({ goPrev, goNext, handleClose }: { goPrev?: () => void; goNext?: () => void; handleClose: () => void }) => {
  return (
    <Box sx={{ display: "flex", gap: fr.spacing("2v") }}>
      {goPrev && (
        <Button
          priority="tertiary"
          iconId="ri-arrow-left-s-line"
          onClick={() => {
            goPrev()
          }}
          data-testid="previous-button"
          aria-label="Résultat précédent"
          title="Résultat précédent"
          size="small"
        />
      )}
      {goNext && (
        <Button
          priority="tertiary"
          iconId="ri-arrow-right-s-line"
          onClick={() => {
            goNext()
          }}
          data-testid="next-button"
          aria-label="Résultat suivant"
          title="Résultat suivant"
          size="small"
        />
      )}
      <Button
        priority="tertiary"
        iconId="ri-close-line"
        onClick={() => {
          handleClose()
        }}
        data-testid="close-detail-button"
        aria-label="Fermer le détail"
        title="Fermer le détail"
        size="small"
      />
    </Box>
  )
}
