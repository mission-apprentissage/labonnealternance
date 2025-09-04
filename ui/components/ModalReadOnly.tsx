"use client"
import { Box, Dialog } from "@mui/material"
import { useEffect } from "react"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useIsMobileDevice } from "@/app/hooks/useIsMobileDevice"

export const ModalReadOnly = ({
  children,
  isOpen,
  onClose,
  size = "md",
  hideCloseButton = false,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  hideCloseButton?: boolean
}) => {
  const isMobile = useIsMobileDevice()

  useEffect(() => {
    window.document.body.className = isOpen ? "is-modal-opened" : ""
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth={size}
      slotProps={{
        paper: {
          sx: {
            p: isMobile ? 1 : 2,
          },
        },
      }}
    >
      {!hideCloseButton && (
        <Box sx={{ display: "flex", mr: { xs: 4, sm: 2, md: 0 }, alignSelf: "flex-end" }}>
          <ModalCloseButton onClose={onClose} />
        </Box>
      )}
      <Box sx={{ padding: 0 }}>{children}</Box>
    </Dialog>
  )
}
