import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

type Props = {
  goPrev?: () => void
  goNext?: () => void
  handleClose: () => void
}

export const getNavigationButtons = ({ goPrev, goNext, handleClose }: Props) => {
  return (
    <>
      {goPrev && (
        <Box>
          <Button
            priority="tertiary"
            iconId="ri-arrow-left-s-line"
            onClick={() => {
              goPrev()
            }}
            data-testid="previous-button"
            title="previous"
            size="small"
          />
        </Box>
      )}
      {goNext && (
        <Box sx={{ ml: 2 }}>
          <Button
            priority="tertiary"
            iconId="ri-arrow-right-s-line"
            onClick={() => {
              goNext()
            }}
            data-testid="next-button"
            title="next"
            size="small"
          />
        </Box>
      )}
      <Box ml={2}>
        <Button
          priority="tertiary"
          iconId="ri-close-line"
          onClick={() => {
            handleClose()
          }}
          data-testid="close-detail-button"
          title="close"
          size="small"
        />
      </Box>
    </>
  )
}
