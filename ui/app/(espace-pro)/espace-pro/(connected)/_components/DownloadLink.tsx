"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress } from "@mui/material"
import type { MouseEvent, ReactNode } from "react"
import { useId, useState } from "react"

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
  detail,
  onDownloaded,
  children,
}: {
  href: string
  fileName: string
  download: () => Promise<Blob>
  messages: DownloadMessages
  align?: "flex-start" | "flex-end"
  className?: string
  /** Format, taille… : affiché sous le lien, hors de son intitulé, et rattaché à lui par aria-describedby. */
  detail?: ReactNode
  /** Appelé une fois le fichier téléchargé, par exemple pour la mesure d'audience. */
  onDownloaded?: () => void
  children: ReactNode
}) => {
  const [status, setStatus] = useState<DownloadStatus>("idle")
  const detailId = useId()
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
      onDownloaded?.()
    } catch {
      setStatus("error")
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: align }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("2v"), maxWidth: "100%" }}>
        {isLoading && <CircularProgress size={16} aria-hidden="true" sx={{ flexShrink: 0, color: fr.colors.decisions.text.actionHigh.blueFrance.default }} />}
        <a
          className={className}
          href={href}
          download={fileName}
          onClick={onClick}
          aria-disabled={isLoading || undefined}
          aria-describedby={detail ? detailId : undefined}
          style={{ overflowWrap: "anywhere" }}
        >
          {children}
        </a>
      </Box>
      {detail && (
        <Box id={detailId} sx={{ mt: fr.spacing("1v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
          {detail}
        </Box>
      )}
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
