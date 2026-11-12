"use client"
import { Box, Dialog } from "@mui/material"
import type { SyntheticEvent } from "react"
import { useEffect } from "react"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useIsMobileDevice } from "@/app/hooks/use-is-mobile-device"

export const ModalReadOnly = ({
  children,
  isOpen,
  onClose,
  size = "md",
  hideCloseButton = false,
  ariaLabelledBy,
  disableRestoreFocus = false,
  onExited,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  hideCloseButton?: boolean
  /** id du titre visible de la modale : sans lui, MUI référence un id absent du DOM. */
  ariaLabelledBy: string
  /** Avec `onExited`, quand l'appelant place lui-même le focus : le piège à focus reste actif jusqu'à la fin de la transition de fermeture. */
  disableRestoreFocus?: boolean
  onExited?: () => void
}) => {
  const isMobile = useIsMobileDevice()

  useEffect(() => {
    window.document.body.className = isOpen ? "is-modal-opened" : ""
    return () => {
      window.document.body.className = ""
    }
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      aria-labelledby={ariaLabelledBy}
      disableRestoreFocus={disableRestoreFocus}
      onClose={(event: SyntheticEvent) => {
        event.stopPropagation()
        onClose()
      }}
      fullScreen={isMobile}
      maxWidth={size}
      slotProps={{
        transition: { onExited },
        paper: {
          onClick: (e) => {
            // empêche la propagation du click sur les éléments sous jacents lors du click en dehors de la modale
            e.stopPropagation()
          },
        },
      }}
    >
      {!hideCloseButton && (
        <Box sx={{ display: "flex", alignSelf: "flex-end" }}>
          <ModalCloseButton onClose={onClose} />
        </Box>
      )}
      <Box sx={{ padding: 0 }}>{children}</Box>
    </Dialog>
  )
}
