"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, Container, Typography } from "@mui/material"
import * as Sentry from "@sentry/nextjs"
import Image from "next/image"
import type { PropsWithChildren } from "react"
import { useEffect } from "react"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { ApiError } from "@/utils/api.utils"

function wasPageReloaded(): boolean {
  const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  return navigationEntry?.type === "reload"
}

function shouldReloadChunkError(): boolean {
  const storageKey = "lba:lastChunkReload"
  const reloadThrottleMs = 30000
  const now = Date.now()

  try {
    const storedValue = window.sessionStorage.getItem(storageKey)
    const lastReload = storedValue ? Number(storedValue) : 0

    if (!lastReload || Number.isNaN(lastReload) || now - lastReload > reloadThrottleMs) {
      window.sessionStorage.setItem(storageKey, String(now))
      return true
    }

    return false
  } catch {
    return !wasPageReloaded()
  }
}

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
    // ChunkLoadError : un chunk JS n'existe plus après un déploiement.
    // On recharge la page silencieusement pour récupérer les nouveaux chunks,
    // avec un garde-fou même si sessionStorage n'est pas disponible.
    if (error instanceof Error && error.name === "ChunkLoadError" && shouldReloadChunkError()) {
      window.location.reload()
      return
    }
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  const details = getErrorDescription(error)

  return (
    <Container maxWidth="xl">
      <Box>
        <Box
          sx={{
            py: fr.spacing("6v"),
            display: "flex",
            justifyContent: "center",
            flexDirection: { xs: "column", md: "row" },
            margin: "auto",
            gap: fr.spacing("8v"),
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography tabIndex={-1} id="content-container" variant="h1">
              Erreur
            </Typography>

            <Typography variant="h2">Un problème technique est survenu</Typography>

            <Typography
              sx={{
                mt: fr.spacing("4v"),
              }}
            >
              Merci de réessayer ultérieurement.
            </Typography>
            <Typography
              sx={{
                mt: fr.spacing("4v"),
              }}
            >
              Si le problème persiste, contactez le support à l’adresse{" "}
              <DsfrLink
                href={`mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent("Signalement d'un problème technique sur La bonne alternance")}`}
                external
                aria-label="Contact de l'équipe La bonne alternance par email - nouvelle fenêtre"
              >
                {publicConfig.publicEmail}
              </DsfrLink>{" "}
              en décrivant votre erreur pour que nous puissions vous répondre.
            </Typography>

            <Typography
              sx={{
                mt: fr.spacing("8v"),
              }}
            >
              {details && <Typography>Message de l'erreur : {details}</Typography>}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", flex: 1, justifyContent: "center" }}>
            <Image src="/images/error_solid.png" alt="" width={279} height={151} />
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
