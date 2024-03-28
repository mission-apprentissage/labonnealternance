import { CloseIcon } from "@chakra-ui/icons"
import { Button } from "@chakra-ui/react"

const LBAModalCloseButton = ({ onClose }) => (
  <Button
    data-testid="close-application-form"
    fontSize="14px"
    color="bluefrance.500"
    fontWeight={400}
    background="none"
    alignItems="baseline"
    height="1.5rem"
    sx={{
      _hover: {
        background: "none",
        textDecoration: "none",
      },
      _active: {
        background: "none",
      },
    }}
    onClick={onClose}
  >
    Fermer <CloseIcon w={2} h={2} ml={2} />
  </Button>
)

export default LBAModalCloseButton
