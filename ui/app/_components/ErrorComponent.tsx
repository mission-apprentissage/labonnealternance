"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import TechnicalErrorArtwork from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/system/technical-error.svg"
import { Box, Container, Typography } from "@mui/material"
import * as Sentry from "@sentry/nextjs"
import Image from "next/image"
import { useEffect } from "react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { ApiError } from "@/utils/api.utils"

function getErrorDescription(error: unknown): string | null {
  if (!error) {
    return null
  }

  if (error instanceof ApiError) {
    return error.context.statusCode < 500 || publicConfig.env === "local" ? error.context.message : null
  }

  if (publicConfig.env === "local") {
    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === "string") {
      return error
    }
  }

  return null
}

export type ErrorProps = { error: Error & { digest?: string }; reset: () => void }

export function ErrorComponent({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  const details = getErrorDescription(error)

  return (
    <Container maxWidth="xl">
      <Box>
        <Box
          sx={{
            p: fr.spacing("3v"),
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            margin: "auto",
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Image src={TechnicalErrorArtwork.src} alt="" width={TechnicalErrorArtwork.width * 2} height={TechnicalErrorArtwork.height * 2} />
          </Box>

          <Box>
            <Typography variant="h1" gutterBottom>
              Une erreur est survenue
            </Typography>
            {details && <Typography gutterBottom>{details}</Typography>}

            <Box mt={2}>
              <Button onClick={() => reset()} type="button">
                Essayer à nouveau
              </Button>
            </Box>

            <Box mt={2}>
              <DsfrLink href="/" locale="fr">
                Retourner à la page d'accueil
              </DsfrLink>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
