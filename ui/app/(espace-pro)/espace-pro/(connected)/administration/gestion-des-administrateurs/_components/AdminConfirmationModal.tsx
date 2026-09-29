import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"
import { useId, useState } from "react"

import { ModalReadOnly } from "@/components/ModalReadOnly"

export const AdminConfirmationModal = ({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void>
}) => {
  const titleId = useId()
  const [isPending, setIsPending] = useState(false)

  const confirm = async () => {
    setIsPending(true)
    try {
      await onConfirm()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={titleId} className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
          {title}
        </Typography>
        <Typography sx={{ mb: fr.spacing("2v"), color: "#3A3A3A", lineHeight: "24px" }}>{children}</Typography>
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: fr.spacing("3v"), mt: fr.spacing("3v") }}>
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
