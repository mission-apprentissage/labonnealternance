"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Container, Typography } from "@mui/material"
import * as Sentry from "@sentry/nextjs"
import Image from "next/image"
import { useEffect, type PropsWithChildren } from "react"

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

export type ErrorProps = { error: unknown; reset: () => void }

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
            <Image src="/images/error_solid.png" alt="" width={558} height={303} />
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

const fallbackRender: Sentry.FallbackRender = ({ error, resetError }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <ErrorComponent error={error} reset={resetError} />
    </Box>
  )
}

export function ErrorBoundary({ children }: PropsWithChildren) {
  return <Sentry.ErrorBoundary fallback={fallbackRender}>{children}</Sentry.ErrorBoundary>
}
