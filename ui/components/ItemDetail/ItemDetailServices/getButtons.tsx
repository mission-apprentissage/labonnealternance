import { Box, Button, Image } from "@chakra-ui/react"

const navigationButtonProperties = {
  background: "white",
  border: "none",
  padding: "0",
  width: "30px",
  height: "30px",
  minWidth: "30px",
  _hover: {
    background: "white",
  },
  _active: {
    background: "white",
  },
}

export const getNavigationButtons = ({ goPrev, goNext, handleClose }) => {
  return (
    <>
      {goPrev && (
        <Box>
          <Button
            {...navigationButtonProperties}
            onClick={() => {
              goPrev()
            }}
            data-testid="previous-button"
          >
            <Image width="30px" height="30px" src="/images/chevronleft.svg" alt="Résultat précédent" />
          </Button>
        </Box>
      )}
      {goNext && (
        <Box ml={2}>
          <Button
            {...navigationButtonProperties}
            onClick={() => {
              goNext()
            }}
            data-testid="next-button"
          >
            <Image width="30px" height="30px" src="/images/chevronright.svg" alt="Résultat suivant" />
          </Button>
        </Box>
      )}
      <Box ml={2}>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            handleClose()
          }}
          data-testid="close-detail-button"
        >
          <Image width="30px" height="30px" src="/images/close.svg" alt="Fermer la fenêtre" />
        </Button>
      </Box>
    </>
  )
}
