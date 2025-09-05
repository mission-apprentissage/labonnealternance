"use client"
import { Box, Dialog } from "@mui/material"
import { useEffect } from "react"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useIsMobileDevice } from "@/app/hooks/useIsMobileDevice"

export const ModalReadOnly = ({
  children,
  isOpen,
  onClose,
  modalContentProps,
  hideCloseButton = false,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  modalContentProps?: any
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
      maxWidth={false}
      PaperProps={{
        sx: {
          overflowY: "auto",
          margin: "auto",
          maxHeight: { xs: "100%", sm: "95%" },
          maxWidth: { xs: "100%", sm: "95%" },
          width: isMobile ? "100vw" : "fit-content",
          height: isMobile ? "100vh" : "auto",
          borderRadius: 0,
          ...modalContentProps,
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
