"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

import { ApiError } from "@/utils/api.utils"

type Props = {
  error: unknown
  /** Ce qui n'a pas pu être affiché, ex. « la liste des formulaires ». */
  subject: string
  /** Message d'un 404 (formulaire supprimé, lien périmé) : ce n'est pas une panne, rien à réessayer. */
  notFound?: { title: string; description: string }
  onRetry: () => void
}

/**
 * Échec de chargement d'une page du back-office des formulaires. Distingue le formulaire introuvable
 * de la panne (5xx, réseau), qui ne doit pas passer pour une liste vide ou un formulaire supprimé.
 */
export function FeedbackFormLoadError({ error, subject, notFound, onRetry }: Props) {
  if (notFound && error instanceof ApiError && error.isNotFoundError()) {
    return <Alert severity="error" title={notFound.title} description={notFound.description} />
  }

  const statusCode = error instanceof ApiError ? error.context.statusCode : undefined
  const cause = statusCode ? `Le serveur a rencontré une erreur (code ${statusCode}).` : "Le serveur ne répond pas."
  return (
    <Box>
      <Alert
        severity="error"
        title={`Impossible d'afficher ${subject}`}
        description={`${cause} Réessayez dans quelques instants ; si le problème persiste, signalez-le à l'équipe technique.`}
      />
      <Button priority="secondary" iconId="fr-icon-refresh-line" iconPosition="left" onClick={onRetry} style={{ marginTop: fr.spacing("4v") }}>
        Réessayer
      </Button>
    </Box>
  )
}
