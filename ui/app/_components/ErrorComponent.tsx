"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import { captureException, type FallbackRender, ErrorBoundary as SentryErrorBoundary } from "@sentry/nextjs"
import Image from "next/image"
import type { PropsWithChildren } from "react"
import { useEffect } from "react"
import { mainId } from "@/app/_components/zone-ids"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
import { ApiError } from "@/utils/api.utils"
import { shouldReloadOnce } from "@/utils/reload-guard.utils"

function shouldReloadChunkError(): boolean {
  return shouldReloadOnce("lba:staleDeploymentReload", 30000)
}

/**
 * Libellés français des conditions d'erreur connues, indexés par code HTTP.
 *
 * Le `message` porté par une ApiError ne peut pas être affiché tel quel : il vient soit d'un
 * littéral du serveur (71 messages 4xx distincts, dont 36 en anglais), soit des messages Zod par
 * défaut — anglais eux aussi, `setupZodErrorMap()` n'étant appelé que côté UI (app/layout.tsx) —,
 * soit du `statusText` HTTP, anglais par nature. Sa langue n'est donc pas connaissable à
 * l'exécution, et aucune valeur de `lang` ne serait correcte (RGAA 8.7). Le code HTTP, lui, est
 * une donnée structurée et indépendante de la langue : c'est sur lui qu'on s'appuie.
 */
const LIBELLE_PAR_STATUT: Record<number, string> = {
  0: "La connexion au service a échoué. Vérifiez votre connexion internet, puis réessayez.",
  400: "Les informations envoyées n'ont pas été acceptées par le service.",
  401: "Votre session a expiré. Reconnectez-vous pour continuer.",
  403: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
  404: "La page ou la ressource demandée n'existe pas, ou n'est plus disponible.",
  408: "Le service a mis trop de temps à répondre.",
  409: "Cette action entre en conflit avec l'état actuel de vos données.",
  413: "Le fichier envoyé est trop volumineux.",
  429: "Trop de demandes envoyées en peu de temps. Patientez quelques instants avant de réessayer.",
}

const LIBELLE_4XX_GENERIQUE = "La demande n'a pas pu être traitée par le service."

const LIBELLE_NOUVELLE_VERSION = "Une nouvelle version du site vient d'être déployée. Rechargez la page pour continuer."

/** `technical` : chaîne brute non traduite, réservée au développement local (cf. getErrorDescription). */
type ErrorDescription = { text: string; technical?: true }

function getErrorDescription(error: unknown): ErrorDescription | null {
  if (!error) {
    return null
  }

  // En local, le message technique brut reste affiché : il sert au diagnostic, et cet
  // environnement n'est pas un site publié. En production il ne part que dans Sentry
  // (captureException ci-dessous) et n'atteint jamais la page.
  if (publicConfig.env === "local") {
    if (error instanceof ApiError) {
      return { text: `${error.context.statusCode} — ${error.context.message}`, technical: true }
    }
    if (error instanceof Error) {
      return { text: error.message, technical: true }
    }
    if (typeof error === "string") {
      return { text: error, technical: true }
    }
    return null
  }

  // Rechargement déjà tenté (garde-fou de shouldReloadChunkError) : l'usager reste sur cette page
  // avec une version obsolète du bundle — seule erreur JS dont la cause soit identifiable.
  if (error instanceof Error && error.name === "ChunkLoadError") {
    return { text: LIBELLE_NOUVELLE_VERSION }
  }

  if (error instanceof ApiError) {
    const { statusCode } = error.context
    // 5xx : rien d'actionnable à dire de plus que le texte de la page ; le détail part dans Sentry.
    if (statusCode >= 500) {
      return null
    }
    return { text: LIBELLE_PAR_STATUT[statusCode] ?? LIBELLE_4XX_GENERIQUE }
  }

  // Erreur JS quelconque : aucun libellé sûr à proposer, et la chaîne d'origine n'a ni langue
  // connue ni sens pour l'usager. Le bloc disparaît, la page reste complète sans lui.
  return null
}

export type ErrorProps = { error: unknown }

export function ErrorComponent({ error }: ErrorProps) {
  useEffect(() => {
    // ChunkLoadError : un chunk JS n'existe plus après un déploiement.
    // On recharge la page silencieusement pour récupérer les nouveaux chunks,
    // avec un garde-fou même si sessionStorage n'est pas disponible.
    if (error instanceof Error && error.name === "ChunkLoadError" && shouldReloadChunkError()) {
      window.location.reload()
      return
    }
    captureException(error)
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
          <Box tabIndex={-1} id={mainId("error")} role="main" sx={{ flex: 1 }}>
            <Typography variant="h1">Erreur</Typography>

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
              <DsfrLink href={`mailto:${publicConfig.publicEmail}?subject=${encodeURIComponent("Signalement d'un problème technique sur La bonne alternance")}`} external>
                {publicConfig.publicEmail}
                <span className="fr-sr-only"> - support de La bonne alternance</span>
              </DsfrLink>{" "}
              en décrivant votre erreur pour que nous puissions vous répondre.
            </Typography>

            {details && (
              <Typography
                sx={{
                  mt: fr.spacing("8v"),
                }}
              >
                {details.technical ? `Message de l'erreur : ${details.text}` : details.text}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: "center", flex: 1, justifyContent: "center" }}>
            <Image src="/images/error_solid.png" alt="" width={279} height={151} />
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

const fallbackRender: FallbackRender = ({ error }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <ErrorComponent error={error} />
    </Box>
  )
}

export function ErrorBoundary({ children }: PropsWithChildren) {
  return <SentryErrorBoundary fallback={fallbackRender}>{children}</SentryErrorBoundary>
}
