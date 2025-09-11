import { fr } from "@codegouvfr/react-dsfr"
import { Typography, Box } from "@mui/material"
import { ReactElement } from "react"

import { useDisclosure } from "@/common/hooks/useDisclosure"

import { ModalReadOnly } from "./ModalReadOnly"

export const InfoTooltipOrModal = ({ tooltipContent, children }: { tooltipContent: React.ReactNode; children: ReactElement }) => {
  const { isOpen: isModalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure()

  const onClick = () => {
    if (isModalOpen) {
      closeModal()
    } else {
      openModal()
    }
  }

  return (
    <>
      <ModalReadOnly isOpen={isModalOpen /* && isMobileBool*/} onClose={closeModal}>
        <Box sx={{ p: fr.spacing("4w") }}>{tooltipContent}</Box>
      </ModalReadOnly>
      <Typography component={"span"} sx={{ ":hover": { cursor: "pointer" } }} onClick={onClick}>
        {children}
      </Typography>
    </>
  )
}
