import { Box, Container, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

type DataDisplayForError = {
  title: string
  text: JSX.Element | string
  dataTestId: string
}

const defaultErrorData: DataDisplayForError = {
  title: "Une erreur est survenue",
  text: "Vous pourrez essayer ultérieurement",
  dataTestId: "CandidatureSpontaneeFailedTitle",
}

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
  [BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY]: {
    title: "Vous avez atteint le nombre maximum de candidature pour aujourd'hui",
    text: "Vous pourrez en envoyer de nouveau demain",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  [BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER]: {
    title: "Vous avez déjà atteint la limite de 3 candidatures envoyées à cette opportunité d’emploi.",
    text: "",
    dataTestId: "CandidatureSpontaneeFailedTooManyApplicationsPerCompany",
  },
  "Internal Server Error": {
    title: "Erreur technique",
    text: "Veuillez patienter quelques instants et réessayer. Si l'erreur persiste merci de nous contacter.",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
} satisfies Record<string, DataDisplayForError>

const CandidatureLbaFailed = ({ sendingState }) => {
  const errorData: DataDisplayForError = sendingStateValues[sendingState] ?? defaultErrorData
  const { dataTestId, title, text } = errorData

  return (
    <Container data-testid="CandidatureSpontaneeFailed">
      <Text as="h1" mb={10} fontSize="1.5rem" fontWeight={700}>
        Erreur
      </Text>
      <Flex direction="row" alignItems="center">
        <Image src="/images/icons/input_value_error.svg" mr={4} alt="" />
        <Text as="h2" fontWeight={700} fontSize="20px" data-testid={dataTestId}>
          {title}
        </Text>
      </Flex>
      <Box mt={10} mb={12} fontSize="18px">
        {text}
      </Box>
    </Container>
  )
}

export default CandidatureLbaFailed
