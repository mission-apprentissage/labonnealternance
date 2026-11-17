"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress } from "@mui/material"
import type { MouseEvent, ReactNode } from "react"
import { useState } from "react"

type DownloadStatus = "idle" | "loading" | "done" | "error"

export type DownloadMessages = Record<Exclude<DownloadStatus, "idle">, string>

/**
 * Le lien pointe sur le fichier : sans JavaScript, le navigateur le télécharge lui-même. Avec, le téléchargement
 * passe par fetch pour afficher l'attente et l'éventuelle erreur, annoncées par la zone role="status".
 */
export const DownloadLink = ({
  href,
  fileName,
  download,
  messages,
  align = "flex-start",
  className = "fr-link fr-link--icon-left fr-icon-download-line",
  children,
}: {
  href: string
  fileName: string
  download: () => Promise<Blob>
  messages: DownloadMessages
  align?: "flex-start" | "flex-end"
  className?: string
  children: ReactNode
}) => {
  const [status, setStatus] = useState<DownloadStatus>("idle")
  const isLoading = status === "loading"

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (isLoading) return
    setStatus("loading")
    try {
      const url = URL.createObjectURL(await download())
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Révoquée tout de suite, l'URL peut annuler le téléchargement que le navigateur n'a pas encore lancé (Firefox).
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: align }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v"), maxWidth: "100%" }}>
        {isLoading && <CircularProgress size={16} aria-hidden="true" sx={{ flexShrink: 0, color: fr.colors.decisions.text.actionHigh.blueFrance.default }} />}
        <a className={className} href={href} download={fileName} onClick={onClick} aria-disabled={isLoading || undefined} style={{ overflowWrap: "anywhere" }}>
          {children}
        </a>
      </Box>
      <Box
        role="status"
        className={status === "error" ? undefined : "fr-sr-only"}
        sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.default.error.default, mt: status === "error" ? fr.spacing("1v") : 0 }}
      >
        {status === "idle" ? "" : messages[status]}
      </Box>
    </Box>
  )
}
