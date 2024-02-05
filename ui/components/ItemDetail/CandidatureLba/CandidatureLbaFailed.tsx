import { Box, Container, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"

const sendingStateValues = {
  "email temporaire non autorisé": {
    title: "Les adresses emails temporaires ne sont pas acceptées",
    text: (
      <>
        Les adresses emails temporaires ne sont pas acceptées pour envoyer des candidatures via La bonne alternance.
        <br />
        Merci d&apos;utiliser une adresse email permanente
      </>
    ),
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  "Too Many Requests": {
    title: "Trop de candidatures envoyées en peu de temps",
    text: "Veuillez patienter quelques instants et réessayer",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  "max candidatures atteint": {
    title: "Vous avez atteint le nombre maximum de candidature pour aujourd'hui",
    text: "Vous pourrez en envoyer de nouveau demain",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  "Internal Server Error": {
    title: "Erreur technique",
    text: "Veuillez patienter quelques instants et réessayer. Si l'erreur persiste merci de nous contacter.",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  "offre expirée": {
    title: "Offre expirée",
    text: "Cette offre n'est plus active",
    dataTestId: "CandidatureSpontaneeFailedExpiredJob",
  },
}

const CandidatureLbaFailed = ({ type, sendingState }) => {
  const errorReasonText = () => {
    return (
      <>
        <Flex direction="row" alignItems="center">
          <Image src="/images/icons/input_value_error.svg" mr={4} alt="" />
          <Text as="h2" fontWeight={700} fontSize="20px" data-testid={sendingStateValues[sendingState]?.dataTestId || "CandidatureSpontaneeFailedTitle"}>
            {sendingStateValues[sendingState]?.title || "Une erreur est survenue"}
          </Text>
        </Flex>
        <Box mt={10} mb={12} fontSize="18px">
          {sendingStateValues[sendingState]?.text || "Vous pourrez essayer ultérieurement"}
        </Box>
      </>
    )
  }

  return (
    <Container data-testid="CandidatureSpontaneeFailed">
      <Text as="h1" mb={10} fontSize="1.5rem" fontWeight={700}>
        {type === "matcha" ? "Candidature à une offre" : "Candidature spontanée"}
      </Text>
      {errorReasonText()}
    </Container>
  )
}

export default CandidatureLbaFailed
