"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Stack, Typography } from "@mui/material"
import Image from "next/image"
import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { hasValidEmail } from "@/app/(candidat)/(recherche)/recherche/_components/hasValidEmail"
import { isOfferActive } from "@/app/(candidat)/(recherche)/recherche/_components/isOfferActive"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { useSubmitCandidature } from "@/components/ItemDetail/CandidatureLba/services/submitCandidature"
import ItemDetailApplicationsStatus from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import { notifyJobPostulerV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"

export function CandidaterButton({
  item,
  CandidaterModal,
  buttonLabel,
}: {
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  buttonLabel: string
  CandidaterModal?: (props: {
    item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
    modalControls: ReturnType<typeof useDisclosure>
    submitControls: ReturnType<typeof useSubmitCandidature>
  }) => React.ReactNode
}) {
  const [modalId, setModalId] = useState<number>(Math.random())
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item)
  const { applicationDate } = submitControls
  const { onOpen } = modalControls
  const kind = item.ideaType

  const openApplicationForm = () => {
    // re-instancie la modal
    setModalId(Math.random())
    onOpen()
    const hasEmail = hasValidEmail(item)
    SendPlausibleEvent("Clic Postuler - Fiche emploi", { partner_label: kind, info_fiche: item.id, "avec contact": hasEmail ? "oui" : "non" })
    notifyJobPostulerV3(item)
  }

  const hasAppliedValue = Boolean(applicationDate)

  return (
    <Box data-testid={`candidater-${item.ideaType}`}>
      <CandidaterModal key={modalId} item={item} modalControls={modalControls} submitControls={submitControls} />
      <Box>
        {hasAppliedValue ? (
          <ItemDetailApplicationsStatus item={item} />
        ) : isOfferActive(item) ? (
          <>
            <Box sx={{ my: 2 }}>
              <Button onClick={openApplicationForm} aria-label="Ouvrir le formulaire d'envoi de candidature" data-testid="postuler-button">
                {buttonLabel}
              </Button>
            </Box>
            {item.company?.mandataire && (
              <Stack direction="row" alignItems="center" sx={{ my: 4 }}>
                <Box component="span">
                  <Image width={16} height={16} src="/images/icons/small_info.svg" alt="" />
                </Box>
                <Typography component="span" variant="body2" sx={{ ml: 2, fontSize: "12px", fontStyle: "italic" }}>
                  Votre candidature sera envoyée au centre de formation en charge du recrutement pour le compte de l'entreprise.{" "}
                </Typography>
              </Stack>
            )}
          </>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}
