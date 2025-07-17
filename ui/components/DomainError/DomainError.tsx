import { Box, Button, Image } from "@chakra-ui/react"
import React, { SyntheticEvent } from "react"

const cssParameters = {
  padding: "1rem",
  background: "#fff1e5",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "20px",
}

interface DomainErrorProps {
  position?: "header" | undefined
  setDomainError: (value: boolean) => void
  setDiplomaError: (value: boolean) => void
}

export default function DomainError({ position = undefined, setDomainError, setDiplomaError }: DomainErrorProps) {
  const reset = (e: SyntheticEvent) => {
    if (e) {
      e.stopPropagation()
    }

    setDomainError(false)
    setDiplomaError(false)
  }

  const getResetButton = () => {
    return (
      <Button variant="blackButton" mt={1} onClick={reset}>
        Réessayer
      </Button>
    )
  }

  const getInColumnError = () => {
    return (
      <Box px={4} data-testid="domainError">
        <Box>
          <Image src="/images/domain_error_main.svg" alt="" />
        </Box>
        <Box {...cssParameters} mb={2}>
          <Image float="left" mr={2} src="/images/domain_error_notice.svg" alt="" />
          Erreur technique momentanée
        </Box>
        <Box fontWeight={700}>Pas de panique !</Box>
        <Box>Il y a forcément un résultat qui vous attend,</Box>
        <Box>
          veuillez revenir ultérieurement
          <br />
          {getResetButton()}
        </Box>
      </Box>
    )
  }

  const getInHeaderError = () => {
    return (
      <Box data-testid="domainError">
        <Box {...cssParameters} mb={2} float="left">
          <Image float="left" mr={2} src="/images/domain_error_notice.svg" alt="" />
          Erreur technique momentanée
        </Box>
        <Box float="left" ml={8} mt={1} fontWeight={700}>
          Veuillez réessayer ultérieurement
          <br />
          {getResetButton()}
        </Box>
      </Box>
    )
  }

  return position && position === "header" ? getInHeaderError() : getInColumnError()
}
