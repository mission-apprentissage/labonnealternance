import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"
import React from "react"

type DataDisplayForError = {
  title: string
  text: React.ReactNode
  dataTestId: string
}

const defaultErrorData: DataDisplayForError = {
  title: "Une erreur est survenue",
  text: "Vous pourrez essayer ultérieurement",
  dataTestId: "CandidatureSpontaneeFailedTitle",
}

const sendingStateValues = {
  ["Bad Request: Disposable email are not allowed"]: {
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
  ["Too Many Requests: Maximum application per day reached"]: {
    title: "Vous avez atteint le nombre maximum de candidature pour aujourd'hui",
    text: "Vous pourrez en envoyer de nouveau demain",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  ["Too Many Requests: Maximum application per offer reached"]: {
    title: "Vous avez déjà atteint la limite de 3 candidatures envoyées à cette opportunité d’emploi.",
    text: "",
    dataTestId: "CandidatureSpontaneeFailedTooManyApplicationsPerCompany",
  },
  ["Too Many Requests: Maximum application per recruiter reached"]: {
    title: "Vous avez atteint le quota maximum de candidatures pour ce SIRET.",
    text: "Vous pourrez en envoyer de nouveau demain",
    dataTestId: "CandidatureSpontaneeFailedTooManyApplicationsPerCompanyPerCaller",
  },
  ["Bad Request: Internal error: no contact email found for the corresponding ressource"]: {
    title: "Aucune information de contact disponible pour postuler",
    text: "Nous ne disposons pas des éléments de contact nécessaires pour relayer votre candidatuer à cette entreprise",
    dataTestId: "CandidatureSpontaneeFailedNoEmail",
  },
  "Internal Server Error": {
    title: "Erreur technique",
    text: "Veuillez patienter quelques instants et réessayer. Si l'erreur persiste merci de nous contacter.",
    dataTestId: "CandidatureSpontaneeFailedTempEmailTitle",
  },
  ["Bad Request: Job offer has expired"]: {
    title: "Offre expirée",
    text: "Cette offre n'est plus active",
    dataTestId: "CandidatureSpontaneeFailedExpiredJob",
  },
  ["Bad Request: File type is not supported"]: {
    title: "Type de fichier non pris en charge par le service",
    text: "Le type de fichier fourni n'est pas accepté. Nous acceptons uniquement les fichiers aux formats PDF ou DOCX.",
    dataTestId: "CandidatureSpontaneeFailedFileType",
  },
} satisfies Record<string, DataDisplayForError>

const CandidatureLbaFailed = ({ error }: { error: string }) => {
  console.log(error)
  const errorData: DataDisplayForError = sendingStateValues[error] ?? defaultErrorData
  const { dataTestId, title, text } = errorData

  return (
    <Container data-testid="CandidatureSpontaneeFailed">
      <Typography variant="h1" sx={{ mb: 5, fontSize: "1.5rem", fontWeight: 700 }}>
        Erreur
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <Image src="/images/icons/input_value_error.svg" width={24} height={24} style={{ marginRight: "16px" }} alt="" />
        <Typography variant="h3" data-testid={dataTestId}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ mt: 5, mb: 8, fontSize: "18px" }}>{text}</Box>
    </Container>
  )
}

export default CandidatureLbaFailed
